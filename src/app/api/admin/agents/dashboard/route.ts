import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const [{ data: cards, error: cardsError }, { data: topAgents, error: topAgentsError }] =
      await Promise.all([
        supabaseAdmin
          .from("v_agent_dashboard")
          .select("*")
          .order("outstanding_balance", { ascending: false }),
        supabaseAdmin
          .from("v_agent_dashboard")
          .select("*")
          .order("gross_sales", { ascending: false })
          .limit(8),
      ]);

    if (cardsError) {
      return NextResponse.json(
        { ok: false, error: cardsError.message },
        { status: 500 }
      );
    }

    if (topAgentsError) {
      return NextResponse.json(
        { ok: false, error: topAgentsError.message },
        { status: 500 }
      );
    }

    const rows = cards ?? [];

    const summary = {
      total_agents: rows.length,
      active_agents: rows.filter((r) => String(r.status || "").toLowerCase() === "active").length,
      blocked_agents: rows.filter((r) => !!r.is_credit_blocked).length,
      total_gross_sales: rows.reduce((sum, r) => sum + Number(r.gross_sales || 0), 0),
      total_commission: rows.reduce((sum, r) => sum + Number(r.total_commission || 0), 0),
      pending_commission: rows.reduce((sum, r) => sum + Number(r.pending_commission || 0), 0),
      total_outstanding: rows.reduce((sum, r) => sum + Number(r.outstanding_balance || 0), 0),
      total_credit_limit: rows.reduce((sum, r) => sum + Number(r.credit_limit || 0), 0),
    };

    return NextResponse.json({
      ok: true,
      summary,
      rows,
      topAgents: topAgents ?? [],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}