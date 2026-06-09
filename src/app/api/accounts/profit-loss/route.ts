import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function num(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function low(v: unknown) {
  return String(v || "").toLowerCase();
}

function isIncome(r: any) {
  const name = low(r.account_name);
  return ["income", "revenue", "sale", "sales", "commission", "earning", "profit"].some((x) =>
    name.includes(x)
  );
}

function isExpense(r: any) {
  const name = low(r.account_name);
  return ["expense", "cost", "salary", "rent", "fuel", "supplier", "purchase", "loss", "charges", "fee"].some((x) =>
    name.includes(x)
  );
}

function productType(name: string) {
  const n = low(name);
  if (n.includes("flight") || n.includes("airline") || n.includes("ticket") || n.includes("bsp")) return "Flights";
  if (n.includes("hotel") || n.includes("room") || n.includes("makkah") || n.includes("madinah")) return "Hotels";
  if (n.includes("transport") || n.includes("vehicle") || n.includes("driver") || n.includes("fuel")) return "Transport";
  if (n.includes("visa")) return "Visa";
  if (n.includes("umrah") || n.includes("package")) return "Umrah Packages";
  return "General";
}

function monthKey(row: any) {
  const raw = row.voucher_date || new Date().toISOString();
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date().toISOString().slice(0, 7) : d.toISOString().slice(0, 7);
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseAdminSafe();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Supabase admin client not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenant_id");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    let ledgerQuery = supabase.from("v_ledger").select("*");

    if (startDate) ledgerQuery = ledgerQuery.gte("voucher_date", startDate);
    if (endDate) ledgerQuery = ledgerQuery.lte("voucher_date", endDate);

    const ledgerRes = await ledgerQuery;

    if (ledgerRes.error) {
      return NextResponse.json({ ok: false, error: ledgerRes.error.message }, { status: 500 });
    }

    let rows = ledgerRes.data || [];

    if (tenantId && rows.some((r: any) => "tenant_id" in r)) {
      rows = rows.filter((r: any) => String(r.tenant_id) === tenantId);
    }

    let incomeRows = rows.filter(isIncome);
    let expenseRows = rows.filter(isExpense);

    if (incomeRows.length === 0) incomeRows = rows.filter((r: any) => num(r.credit) > num(r.debit));
    if (expenseRows.length === 0) expenseRows = rows.filter((r: any) => num(r.debit) > num(r.credit));

    const totalRevenue = incomeRows.reduce((a: number, r: any) => a + Math.max(0, num(r.credit) - num(r.debit)), 0);
    const totalExpenses = expenseRows.reduce((a: number, r: any) => a + Math.max(0, num(r.debit) - num(r.credit)), 0);
    const netProfit = totalRevenue - totalExpenses;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const expenseRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;
    const breakEvenGap = netProfit < 0 ? Math.abs(netProfit) : 0;

    const expenseMap = new Map<string, any>();
    const incomeMap = new Map<string, any>();
    const monthlyMap = new Map<string, any>();
    const travelMap = new Map<string, any>();

    for (const r of rows) {
      const debit = num(r.debit);
      const credit = num(r.credit);
      const accountName = r.account_name || "Unknown";
      const month = monthKey(r);
      const segment = productType(accountName);

      const m = monthlyMap.get(month) || { month, revenue: 0, expenses: 0, profit: 0 };
      const t = travelMap.get(segment) || { product: segment, revenue: 0, expenses: 0, profit: 0, margin: 0 };

      if (isIncome(r) || credit > debit) {
        const amount = Math.max(0, credit - debit);
        const prev = incomeMap.get(accountName) || { account_id: r.account_id || null, account_name: accountName, amount: 0 };
        prev.amount += amount;
        incomeMap.set(accountName, prev);
        m.revenue += amount;
        t.revenue += amount;
      }

      if (isExpense(r) || debit > credit) {
        const amount = Math.max(0, debit - credit);
        const prev = expenseMap.get(accountName) || { account_id: r.account_id || null, account_name: accountName, amount: 0 };
        prev.amount += amount;
        expenseMap.set(accountName, prev);
        m.expenses += amount;
        t.expenses += amount;
      }

      m.profit = m.revenue - m.expenses;
      t.profit = t.revenue - t.expenses;
      t.margin = t.revenue > 0 ? (t.profit / t.revenue) * 100 : 0;

      monthlyMap.set(month, m);
      travelMap.set(segment, t);
    }

    let trends = Array.from(monthlyMap.values()).sort((a, b) => String(a.month).localeCompare(String(b.month)));
    if (trends.length === 1) trends = [{ month: "Previous", revenue: 0, expenses: 0, profit: 0 }, ...trends];

    const topExpenses = Array.from(expenseMap.values()).sort((a, b) => b.amount - a.amount).slice(0, 10);
    const topIncome = Array.from(incomeMap.values()).sort((a, b) => b.amount - a.amount).slice(0, 10);

    const travelProfitDNA = Array.from(travelMap.values()).sort((a, b) => b.profit - a.profit);
    const bestSegment = travelProfitDNA[0] || null;
    const weakSegment = [...travelProfitDNA].filter((x) => x.revenue > 0).sort((a, b) => a.margin - b.margin)[0] || null;

    const lastProfit = num(trends[trends.length - 1]?.profit);
    const prevProfit = num(trends[trends.length - 2]?.profit);
    const forecastProfit = trends.length >= 2 ? lastProfit + (lastProfit - prevProfit) : netProfit;

    const healthScore = Math.round(
      Math.min(100, Math.max(0, 50 + netMargin * 1.2 - (expenseRatio > 75 ? 15 : 0) + (netProfit > 0 ? 10 : -25)))
    );

    const expenseCutTarget = breakEvenGap > 0 ? breakEvenGap * 0.45 : totalExpenses * 0.05;
    const revenueGrowthTarget = breakEvenGap > 0 ? breakEvenGap * 0.55 : totalRevenue * 0.08;
    const dailyRecoveryTarget = breakEvenGap > 0 ? breakEvenGap / 30 : 0;

    const alerts: any[] = [];

    if (netProfit < 0) alerts.push({ type: "critical", title: "Recovery Required", message: `Recover PKR ${Math.round(breakEvenGap)} to reach break-even.` });
    if (expenseRatio > 75) alerts.push({ type: "warning", title: "Expense Pressure", message: `Expenses are ${expenseRatio.toFixed(1)}% of revenue.` });
    if (weakSegment) alerts.push({ type: "warning", title: "Weak Segment Margin", message: `${weakSegment.product} margin is only ${weakSegment.margin.toFixed(1)}%.` });
    if (topExpenses[0]) alerts.push({ type: "info", title: "Main Profit Leak", message: `${topExpenses[0].account_name} is the largest cost head.` });

    const recoveryPlan = {
      required: netProfit < 0,
      title: netProfit < 0 ? "AI CFO Recovery Strategy" : "AI CFO Growth Strategy",
      breakEvenGap,
      expenseCutTarget,
      revenueGrowthTarget,
      dailyRecoveryTarget,
      recoveryDays: breakEvenGap > 0 ? 30 : 0,
      actions: [
        topExpenses[0] ? `Reduce ${topExpenses[0].account_name} by PKR ${Math.round(expenseCutTarget * 0.45)} this month.` : "Freeze non-essential spending.",
        topExpenses[1] ? `Negotiate ${topExpenses[1].account_name} by PKR ${Math.round(expenseCutTarget * 0.25)}.` : "Set approval control for new expenses.",
        topIncome[0] ? `Grow ${topIncome[0].account_name} by PKR ${Math.round(revenueGrowthTarget * 0.55)}.` : "Push high-margin Umrah bundles.",
        weakSegment ? `Improve ${weakSegment.product} margin from ${weakSegment.margin.toFixed(1)}% by repricing or vendor negotiation.` : "Build segment-wise margin targets.",
      ],
    };

    return NextResponse.json({
      ok: true,
      rowsCount: rows.length,
      trends,
      topExpenses,
      topIncome,
      alerts,
      recoveryPlan,
      travelProfitDNA,
      cfo: {
        riskMeter: netProfit < 0 ? "Danger" : expenseRatio > 75 ? "Warning" : "Safe",
        cashBurnDays: totalExpenses > 0 ? Math.round((Math.max(totalRevenue, 1) / totalExpenses) * 30) : 999,
        supplierSavingPotential: Math.round(totalExpenses * 0.08),
        opportunityValue: Math.round(totalRevenue * 0.12),
        bestSegment: bestSegment?.product || "No segment found",
        weakSegment: weakSegment?.product || "No weak segment found",
        boardRecommendation:
          netProfit < 0
            ? `AI CFO Assistant: Recovery required. Cut PKR ${Math.round(expenseCutTarget)} cost and grow PKR ${Math.round(revenueGrowthTarget)} revenue.`
            : `AI CFO Assistant: Profit is healthy. Scale ${bestSegment?.product || "high-margin products"} and monitor ${weakSegment?.product || "low-margin segments"}.`,
      },
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        netMargin,
        expenseRatio,
        breakEvenGap,
        healthScore,
        forecastProfit,
        insight:
          netProfit >= 0
            ? `AI Profit Radar: Business is profitable with ${netMargin.toFixed(1)}% margin.`
            : `AI Profit Radar: Loss detected. Recover PKR ${Math.round(breakEvenGap)} to reach break-even.`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Unexpected server error" }, { status: 500 });
  }
}