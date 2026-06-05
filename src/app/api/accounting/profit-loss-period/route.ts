import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function num(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function lower(value: unknown) {
  return String(value || "").toLowerCase();
}

function isIncome(row: any) {
  const name = lower(row.account_name);
  return ["income", "revenue", "sale", "sales", "commission", "earning", "profit"].some((x) =>
    name.includes(x)
  );
}

function isExpense(row: any) {
  const name = lower(row.account_name);
  return [
    "expense",
    "cost",
    "salary",
    "rent",
    "fuel",
    "supplier",
    "purchase",
    "loss",
    "charges",
    "fee",
  ].some((x) => name.includes(x));
}

export async function GET() {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json({ ok: false, error: "DB Error" }, { status: 500 });
    }

    const [ledgerRes, trendRes] = await Promise.all([
      supabase.from("v_ledger").select("*"),
      supabase
        .from("v_monthly_analytics")
        .select("*")
        .order("month", { ascending: true })
        .limit(12),
    ]);

    if (ledgerRes.error) {
      return NextResponse.json({ ok: false, error: ledgerRes.error.message }, { status: 500 });
    }

    const rows = ledgerRes.data || [];
    const trends = trendRes.data || [];

    const incomeRows = rows.filter(isIncome);
    const expenseRows = rows.filter(isExpense);

    const totalRevenue = incomeRows.reduce(
      (a: number, r: any) => a + (num(r.credit) - num(r.debit)),
      0
    );

    const totalExpenses = expenseRows.reduce(
      (a: number, r: any) => a + (num(r.debit) - num(r.credit)),
      0
    );

    const netProfit = totalRevenue - totalExpenses;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const expenseRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;
    const breakEvenGap = netProfit < 0 ? Math.abs(netProfit) : 0;

    const groupedExpenses = new Map<string, number>();
    const groupedIncome = new Map<string, number>();

    for (const row of expenseRows) {
      const name = row.account_name || "Unknown Expense";
      groupedExpenses.set(name, (groupedExpenses.get(name) || 0) + (num(row.debit) - num(row.credit)));
    }

    for (const row of incomeRows) {
      const name = row.account_name || "Unknown Income";
      groupedIncome.set(name, (groupedIncome.get(name) || 0) + (num(row.credit) - num(row.debit)));
    }

    const topExpenses = Array.from(groupedExpenses.entries())
      .map(([account_name, amount]) => ({ account_name, amount }))
      .filter((r) => r.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    const topIncome = Array.from(groupedIncome.entries())
      .map(([account_name, amount]) => ({ account_name, amount }))
      .filter((r) => r.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    const lastProfit = num(trends[trends.length - 1]?.profit);
    const prevProfit = num(trends[trends.length - 2]?.profit);
    const forecastProfit = trends.length >= 2 ? lastProfit + (lastProfit - prevProfit) : netProfit;

    const healthScore = Math.round(
      Math.min(
        100,
        Math.max(
          0,
          50 + netMargin * 1.2 - (expenseRatio > 75 ? 15 : 0) + (netProfit > 0 ? 10 : -25)
        )
      )
    );

    const expenseCutTarget = breakEvenGap > 0 ? breakEvenGap * 0.45 : totalExpenses * 0.05;
    const revenueGrowthTarget = breakEvenGap > 0 ? breakEvenGap * 0.55 : totalRevenue * 0.08;

    const dailyRecoveryTarget = breakEvenGap > 0 ? breakEvenGap / 30 : 0;
    const recoveryDays =
      breakEvenGap > 0 && dailyRecoveryTarget > 0 ? Math.ceil(breakEvenGap / dailyRecoveryTarget) : 0;

    const recoveryPlan = {
      required: netProfit < 0,
      title: netProfit < 0 ? "AI Recovery Plan Required" : "Growth Optimization Plan",
      breakEvenGap,
      expenseCutTarget,
      revenueGrowthTarget,
      dailyRecoveryTarget,
      recoveryDays,
      actions: [
        topExpenses[0]
          ? `Reduce ${topExpenses[0].account_name} by at least ${Math.round(
              expenseCutTarget * 0.45
            )} this month.`
          : "Review largest expense heads and freeze non-essential spending.",
        topExpenses[1]
          ? `Negotiate or control ${topExpenses[1].account_name} by ${Math.round(
              expenseCutTarget * 0.25
            )}.`
          : "Set approval control for new expense entries.",
        topIncome[0]
          ? `Increase ${topIncome[0].account_name} by ${Math.round(
              revenueGrowthTarget * 0.55
            )} through focused sales push.`
          : "Push high-margin packages and agent sales.",
        `Daily recovery target: ${Math.round(dailyRecoveryTarget)} until break-even.`,
      ],
    };

    const alerts = [];

    if (netProfit < 0) {
      alerts.push({
        type: "critical",
        title: "Loss Detected",
        message: `Break-even recovery required: PKR ${breakEvenGap.toFixed(0)}.`,
      });
    }

    if (expenseRatio > 75) {
      alerts.push({
        type: "warning",
        title: "Expense Pressure High",
        message: `Expenses are ${expenseRatio.toFixed(1)}% of revenue.`,
      });
    }

    if (topExpenses[0]) {
      alerts.push({
        type: "info",
        title: "Main Profit Leak",
        message: `${topExpenses[0].account_name} is the biggest expense head.`,
      });
    }

    return NextResponse.json({
      ok: true,
      rows,
      trends,
      topExpenses,
      topIncome,
      alerts,
      recoveryPlan,
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
            : `AI Profit Radar: Loss detected. Recover PKR ${breakEvenGap.toFixed(0)} to reach break-even.`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}