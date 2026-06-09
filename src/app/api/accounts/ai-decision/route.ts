import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function n(v: unknown) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

function statusFromRisk(score: number) {
  if (score >= 80) return "Critical";
  if (score >= 60) return "Action Required";
  if (score >= 35) return "Warning";
  return "Healthy";
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseAdminSafe();
    const url = new URL(req.url);
    const tenantId =
      url.searchParams.get("tenant_id") ||
      req.headers.get("x-tenant-id") ||
      "demo-tenant";

    let revenue = 5_000_000;
    let total_cost = 4_200_000;
    let pending_payments = 850_000;
    let confirmed_bookings = 124;

    let scenarios: any[] = [];

    if (supabase) {
      const { data: ledgerRows } = await supabase
        .from("v_ledger")
        .select("*")
        .eq("tenant_id", tenantId)
        .limit(5000);

      if (ledgerRows?.length) {
        revenue = ledgerRows
          .filter((r: any) =>
            String(r.account_name || r.description || "").toLowerCase().includes("sale")
          )
          .reduce((s: number, r: any) => s + n(r.credit), 0);

        total_cost = ledgerRows
          .filter((r: any) =>
            String(r.account_name || r.description || "")
              .toLowerCase()
              .match(/cost|expense|supplier|purchase/)
          )
          .reduce((s: number, r: any) => s + n(r.debit), 0);

        pending_payments = ledgerRows
          .filter((r: any) =>
            String(r.account_name || r.description || "")
              .toLowerCase()
              .match(/receivable|agent|outstanding|pending/)
          )
          .reduce((s: number, r: any) => s + Math.abs(n(r.debit) - n(r.credit)), 0);
      }

      const { count } = await supabase
        .from("transport_bookings")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId);

      if (typeof count === "number") confirmed_bookings = count;

      const scenarioRes = await supabase
        .from("ai_decision_scenarios")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })
        .limit(10);

      scenarios = scenarioRes.data || [];
    }

    const estimated_profit = revenue - total_cost;
    const margin = revenue ? (estimated_profit / revenue) * 100 : 0;
    const pendingRatio = revenue ? (pending_payments / revenue) * 100 : 0;

    const risk_score = Math.min(
      100,
      Math.round(
        pendingRatio * 1.4 +
          (margin < 10 ? 35 : margin < 18 ? 18 : 5) +
          (pending_payments > 1_000_000 ? 18 : 8)
      )
    );

    return NextResponse.json({
      ok: true,
      data: {
        tenant_id: tenantId,
        revenue,
        total_cost,
        estimated_profit,
        margin: Number(margin.toFixed(2)),
        confirmed_bookings,
        pending_payments,
        expected_inflow_7d: Math.round(pending_payments * 0.52),
        expected_inflow_30d: Math.round(pending_payments * 0.78),
        risk_score,
        status: statusFromRisk(risk_score),
        insight:
          margin < 12
            ? "Profit margin is under pressure. Reduce leakage, renegotiate supplier rates, and tighten agent credit before scaling sales."
            : "Financial position is stable. Best opportunity is controlled scaling with high-margin agents and routes.",
        trends: {
          revenue: [42, 48, 45, 52, 57, 54, 61],
          profit: [20, 22, 19, 26, 28, 31, 34],
          risk: [34, 38, 42, 45, 49, 47, risk_score],
          cash: [25, 28, 31, 35, 38, 42, 45],
        },
        risk_contributors: [
          { name: "Agent Alpha", exposure: 420000, reason: "High pending balance", severity: "Critical" },
          { name: "Agent Beta", exposure: 285000, reason: "Slow recovery pattern", severity: "High" },
          { name: "Gamma Tours", exposure: 145000, reason: "Margin below target", severity: "Medium" },
        ],
        ai_actions: [
          {
            title: "Activate Recovery Mode",
            impact: "+PKR 220k expected cash recovery",
            urgency: "High",
            action: "Send WhatsApp reminders to risky agents",
            href: "/accounts/reports/outstanding?risk_filter=danger",
          },
          {
            title: "Review Agent Commission",
            impact: "Protect 2.5% margin leakage",
            urgency: "High",
            action: "Open agent ledger and review commission exposure",
            href: "/accounts/agent-ledger",
          },
          {
            title: "Supplier Rate Renegotiation",
            impact: "+PKR 160k possible profit gain",
            urgency: "Medium",
            action: "Review supplier cost pressure",
            href: "/accounts/ledger?search=supplier",
          },
        ],
        scenarios,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "AI decision route failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdminSafe();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Supabase admin client not configured" }, { status: 500 });
    }

    const body = await req.json();

    const payload = {
      tenant_id: body.tenant_id || "demo-tenant",
      title: body.title || "AI Scenario Snapshot",
      revenue: n(body.revenue),
      original_profit: n(body.original_profit),
      simulated_profit: n(body.simulated_profit),
      projected_margin: n(body.projected_margin),
      commission_rate: n(body.commission_rate),
      supplier_saving_rate: n(body.supplier_saving_rate),
      recovery_rate: n(body.recovery_rate),
      recovery_gain: n(body.recovery_gain),
    };

    const { data, error } = await supabase
      .from("ai_decision_scenarios")
      .insert([payload])
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to save scenario" },
      { status: 500 }
    );
  }
}