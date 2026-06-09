import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const [{ data: statusRows, error: statusError }, { data: ledgerRows, error: ledgerError }] =
      await Promise.all([
        supabaseAdmin
          .from("v_agent_credit_status")
          .select("*")
          .order("outstanding_balance", { ascending: false }),
        supabaseAdmin
          .from("agent_credit_ledger")
          .select(`
            *,
            agent:agents(id, name, agent_code)
          `)
          .order("created_at", { ascending: false })
          .limit(150),
      ]);

    if (statusError) {
      return NextResponse.json({ ok: false, error: statusError.message }, { status: 500 });
    }

    if (ledgerError) {
      return NextResponse.json({ ok: false, error: ledgerError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      statusRows: statusRows ?? [],
      ledgerRows: ledgerRows ?? [],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const action = String(body?.action || "");

    if (action === "add_payment") {
      const payload = {
        tenant_id: body.tenant_id,
        agent_id: body.agent_id,
        entry_type: "credit",
        source_type: "manual_payment",
        source_id: null,
        amount: Number(body.amount || 0),
        currency: body.currency || "PKR",
        notes: body.notes || "Manual payment received",
      };

      if (!payload.tenant_id || !payload.agent_id || payload.amount <= 0) {
        return NextResponse.json(
          { ok: false, error: "tenant_id, agent_id and valid amount are required" },
          { status: 400 }
        );
      }

      const { data, error } = await supabaseAdmin
        .from("agent_credit_ledger")
        .insert([payload])
        .select()
        .single();

      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, data });
    }

    if (action === "add_adjustment") {
      const payload = {
        tenant_id: body.tenant_id,
        agent_id: body.agent_id,
        entry_type: body.entry_type === "credit" ? "credit" : "debit",
        source_type: "manual_adjustment",
        source_id: null,
        amount: Number(body.amount || 0),
        currency: body.currency || "PKR",
        notes: body.notes || "Manual adjustment",
      };

      if (!payload.tenant_id || !payload.agent_id || payload.amount <= 0) {
        return NextResponse.json(
          { ok: false, error: "tenant_id, agent_id and valid amount are required" },
          { status: 400 }
        );
      }

      const { data, error } = await supabaseAdmin
        .from("agent_credit_ledger")
        .insert([payload])
        .select()
        .single();

      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, data });
    }

    if (action === "toggle_block") {
      const agentId = String(body?.agent_id || "");
      const isBlocked = !!body?.is_credit_blocked;

      if (!agentId) {
        return NextResponse.json({ ok: false, error: "agent_id is required" }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from("agents")
        .update({ is_credit_blocked: isBlocked })
        .eq("id", agentId)
        .select("id, name, agent_code, is_credit_blocked")
        .single();

      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, data });
    }

    if (action === "update_limit") {
      const agentId = String(body?.agent_id || "");
      const creditLimit = Number(body?.credit_limit || 0);

      if (!agentId) {
        return NextResponse.json({ ok: false, error: "agent_id is required" }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from("agents")
        .update({ credit_limit: creditLimit })
        .eq("id", agentId)
        .select("id, name, agent_code, credit_limit")
        .single();

      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, data });
    }

    return NextResponse.json(
      { ok: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}