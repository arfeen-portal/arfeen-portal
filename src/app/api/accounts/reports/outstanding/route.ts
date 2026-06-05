import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function n(value: unknown) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
}

function s(value: unknown) {
  return String(value || "").trim();
}

function riskLabel(score: number) {
  if (score < 35) return "DANGER";
  if (score < 65) return "WARNING";
  return "STABLE";
}

function recommendedAction(row: any, score: number, ninetyPlus: number, total: number) {
  if (score < 35) return "Freeze credit, escalate recovery, and request immediate settlement.";
  if (ninetyPlus > 0) return "Send recovery reminder and collect promised payment date.";
  if (n(row.total_open_invoices) >= 5) return "Review invoice ageing and reduce new credit exposure.";
  if (total > 0) return "Monitor closely and follow up before ageing worsens.";
  return "No action required.";
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: "Supabase admin client not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const tenantId = s(searchParams.get("tenant_id"));
    const search = s(searchParams.get("search")).toLowerCase();
    const risk = s(searchParams.get("risk")).toUpperCase();

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "tenant_id required" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("v_outstanding_summary")
      .select("*")
      .eq("tenant_id", tenantId);

    if (search) {
      query = query.ilike("agent_name", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const rows = (data || []).map((row: any) => {
      const total = n(row.outstanding_amount);
      const b0 = n(row.bucket_0_30);
      const b30 = n(row.bucket_31_60);
      const b60 = n(row.bucket_61_90);
      const b90 = n(row.bucket_90_plus);
      const openInvoices = n(row.total_open_invoices);

      const ninetyRatio = total > 0 ? b90 / total : 0;
      const sixtyPlusRatio = total > 0 ? (b60 + b90) / total : 0;

      let health =
        100 -
        ninetyRatio * 60 -
        sixtyPlusRatio * 25 -
        openInvoices * 0.75;

      health = Math.max(0, Math.min(100, Math.round(health)));

      const badDebtRisk = Math.round(total * (1 - health / 100));
      const priorityScore = Math.round(
        badDebtRisk * 0.6 + b90 * 0.3 + openInvoices * 100
      );

      const riskCategory = riskLabel(health);

      return {
        ...row,
        agent_name: s(row.agent_name) || "Unknown Party",
        agent_phone: s(row.agent_phone),
        outstanding_amount: total,
        bucket_0_30: b0,
        bucket_31_60: b30,
        bucket_61_90: b60,
        bucket_90_plus: b90,
        total_open_invoices: openInvoices,
        recovered_this_month: n(row.recovered_this_month),
        opening_outstanding_amount: n(row.opening_outstanding_amount),
        health_score: health,
        risk_category: riskCategory,
        bad_debt_risk: badDebtRisk,
        recovery_priority_score: priorityScore,
        aging_pressure_ratio:
          total > 0 ? Number((sixtyPlusRatio * 100).toFixed(2)) : 0,
        ai_recommended_action: recommendedAction(row, health, b90, total),
      };
    });

    const filtered =
      risk && risk !== "ALL"
        ? rows.filter((r: any) => r.risk_category === risk)
        : rows;

    filtered.sort(
      (a: any, b: any) =>
        b.recovery_priority_score - a.recovery_priority_score
    );

    const summary = filtered.reduce(
      (acc: any, r: any) => {
        acc.total_exposure += n(r.outstanding_amount);
        acc.bad_debt_risk += n(r.bad_debt_risk);
        acc.bucket_90_plus += n(r.bucket_90_plus);
        acc.open_invoices += n(r.total_open_invoices);
        acc.recovered_this_month += n(r.recovered_this_month);
        acc.opening_outstanding_amount += n(r.opening_outstanding_amount);

        if (r.risk_category === "DANGER") acc.danger_count += 1;
        if (r.risk_category === "WARNING") acc.warning_count += 1;
        if (r.risk_category === "STABLE") acc.stable_count += 1;

        return acc;
      },
      {
        total_exposure: 0,
        bad_debt_risk: 0,
        bucket_90_plus: 0,
        open_invoices: 0,
        recovered_this_month: 0,
        opening_outstanding_amount: 0,
        recovery_efficiency_ratio: 0,
        cash_pressure_score: 0,
        danger_count: 0,
        warning_count: 0,
        stable_count: 0,
      }
    );

    summary.recovery_efficiency_ratio =
      summary.opening_outstanding_amount > 0
        ? Math.round(
            (summary.recovered_this_month /
              summary.opening_outstanding_amount) *
              100
          )
        : 0;

    summary.cash_pressure_score =
      summary.total_exposure > 0
        ? Math.round((summary.bad_debt_risk / summary.total_exposure) * 100)
        : 0;

    return NextResponse.json({
      success: true,
      summary,
      rows: filtered,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}