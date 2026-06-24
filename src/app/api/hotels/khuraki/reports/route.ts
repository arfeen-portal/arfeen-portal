import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function res(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

async function auth() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Missing auth session", status: 401 };

  const { data: userData, error } = await supabase.auth.getUser();
  if (error || !userData?.user) return { error: "Invalid auth token", status: 401 };

  const email = userData.user.email?.toLowerCase();
  if (!email) return { error: "Invalid auth token", status: 401 };

  const { data: profile } = await supabase
    .from("users")
    .select("tenant_id, role")
    .eq("email", email)
    .maybeSingle();

  if (!profile?.tenant_id) return { error: "Tenant not found", status: 403 };

  return {
    tenant_id: profile.tenant_id,
    role: profile.role,
  };
}

function sum(rows: any[], key: string) {
  return rows.reduce((total, row) => total + Number(row?.[key] || 0), 0);
}

export async function GET(req: NextRequest) {
  try {
    const a = await auth();
    if ("error" in a) return res({ ok: false, error: a.error }, a.status);

    const supabase = getSupabaseAdminSafe();
    if (!supabase) return res({ ok: false, error: "Supabase admin not configured" }, 500);

    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let contractsQuery = supabase
      .from("hotel_khuraki_contracts")
      .select("*")
      .eq("tenant_id", a.tenant_id);

    if (city && city !== "all") contractsQuery = contractsQuery.eq("city", city);
    if (status && status !== "all") contractsQuery = contractsQuery.eq("status", status);

    let vouchersQuery = supabase
      .from("hotel_khuraki_voucher_stays")
      .select("*")
      .eq("tenant_id", a.tenant_id);

    if (city && city !== "all") vouchersQuery = vouchersQuery.eq("city", city);
    if (from) vouchersQuery = vouchersQuery.gte("check_out_date", from);
    if (to) vouchersQuery = vouchersQuery.lte("check_out_date", to);

    let incidentsQuery = supabase
      .from("hotel_khuraki_incidents")
      .select("*")
      .eq("tenant_id", a.tenant_id);

    if (from) incidentsQuery = incidentsQuery.gte("created_at", from);
    if (to) incidentsQuery = incidentsQuery.lte("created_at", `${to}T23:59:59.999Z`);

    let billsQuery = supabase
      .from("hotel_khuraki_supplier_bills")
      .select("*")
      .eq("tenant_id", a.tenant_id);

    if (status && status !== "all") billsQuery = billsQuery.eq("status", status);
    if (from) billsQuery = billsQuery.gte("bill_date", from);
    if (to) billsQuery = billsQuery.lte("bill_date", to);

    let dailyRunsQuery = supabase
      .from("hotel_khuraki_daily_runs")
      .select("*")
      .eq("tenant_id", a.tenant_id);

    if (status && status !== "all") dailyRunsQuery = dailyRunsQuery.eq("status", status);
    if (from) dailyRunsQuery = dailyRunsQuery.gte("run_date", from);
    if (to) dailyRunsQuery = dailyRunsQuery.lte("run_date", to);

    const [
      contractsRes,
      vouchersRes,
      incidentsRes,
      billsRes,
      logsRes,
      dailyRunsRes,
    ] = await Promise.all([
      contractsQuery,
      vouchersQuery,
      incidentsQuery,
      billsQuery,
      supabase
        .from("hotel_khuraki_ai_logs")
        .select("*")
        .eq("tenant_id", a.tenant_id),
      dailyRunsQuery,
    ]);

    if (contractsRes.error) return res({ ok: false, error: contractsRes.error.message }, 500);
    if (vouchersRes.error) return res({ ok: false, error: vouchersRes.error.message }, 500);
    if (incidentsRes.error) return res({ ok: false, error: incidentsRes.error.message }, 500);
    if (billsRes.error) return res({ ok: false, error: billsRes.error.message }, 500);
    if (logsRes.error) return res({ ok: false, error: logsRes.error.message }, 500);
    if (dailyRunsRes.error) return res({ ok: false, error: dailyRunsRes.error.message }, 500);

    const contracts = contractsRes.data || [];
    const vouchers = vouchersRes.data || [];
    const incidents = incidentsRes.data || [];
    const bills = billsRes.data || [];
    const logs = logsRes.data || [];
    const dailyRuns = dailyRunsRes.data || [];
    const today = new Date().toISOString().slice(0, 10);

    const summary = {
      total_contracts: contracts.length,
      active_contracts: contracts.filter((item: any) => item.status === "active").length,
      total_pax: sum(contracts, "total_pax"),
      voucher_stays_count: vouchers.length,
      checked_in_count: vouchers.filter((item: any) => item.status === "checked_in").length,
      checked_out_count: vouchers.filter((item: any) => item.status === "checked_out").length,
      checkout_due_count: vouchers.filter((item: any) => {
        const status = String(item.status || "");
        const callStatus = String(item.checkout_call_status || "");
        return (
          item.check_out_date <= today &&
          ["checked_in", "checkout_due", "extended"].includes(status) &&
          ["pending", "not_answered"].includes(callStatus)
        );
      }).length,
      active_incidents: incidents.filter((item: any) => {
        const status = String(item.status || "open").toLowerCase();
        return !["resolved", "closed", "cancelled"].includes(status);
      }).length,
      supplier_bills_count: bills.length,
      high_overbilling_risk_bills: bills.filter((item: any) => Number(item.ai_overbilling_risk || 0) > 65).length,
      ai_logs_requiring_action: logs.filter((item: any) => item.action_required === true).length,
    };

    const daily_run_totals = {
      planned_pax: sum(dailyRuns, "planned_pax"),
      actual_pax: sum(dailyRuns, "actual_pax"),
      meals_served: sum(dailyRuns, "meals_served"),
      shortage_total: sum(dailyRuns, "shortage_count"),
      waste_total: sum(dailyRuns, "waste_count"),
    };

    return res({
      ok: true,
      summary,
      daily_run_totals,
      incidents: {
        total: incidents.length,
        critical: incidents.filter((item: any) => item.severity === "critical").length,
        high: incidents.filter((item: any) => item.severity === "high").length,
        active: summary.active_incidents,
      },
      supplier_bills: {
        total: bills.length,
        high_risk: summary.high_overbilling_risk_bills,
        pending: bills.filter((item: any) => item.status === "pending").length,
      },
    });
  } catch (e: any) {
    return res({ ok: false, error: e.message || "Unexpected error" }, 500);
  }
}
