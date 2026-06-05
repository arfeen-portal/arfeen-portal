import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    const [{ data: rules, error: rulesError }, { data: entries, error: entriesError }, { data: summary, error: summaryError }] =
      await Promise.all([
        supabaseAdmin
          .from("agent_commission_rules")
          .select(`
            *,
            agent:agents(id, name, agent_code)
          `)
          .order("updated_at", { ascending: false }),
        supabaseAdmin
          .from("agent_commission_entries")
          .select(`
            *,
            agent:agents(id, name, agent_code)
          `)
          .order("created_at", { ascending: false })
          .limit(100),
        supabaseAdmin
          .from("v_agent_commission_summary")
          .select("*")
          .order("pending_commission", { ascending: false }),
      ]);

    if (rulesError) {
      return NextResponse.json({ ok: false, error: rulesError.message }, { status: 500 });
    }

    if (entriesError) {
      return NextResponse.json({ ok: false, error: entriesError.message }, { status: 500 });
    }

    if (summaryError) {
      return NextResponse.json({ ok: false, error: summaryError.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      rules: rules ?? [],
      entries: entries ?? [],
      summary: summary ?? [],
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

    if (action === "save_rule") {
      const payload = {
        tenant_id: body.tenant_id,
        agent_id: body.agent_id,
        rule_name: body.rule_name || "Default Rule",
        applies_to: body.applies_to || "transport",
        commission_mode: body.commission_mode || "percent",
        commission_value: Number(body.commission_value || 0),
        is_active: body.is_active ?? true,
        notes: body.notes || null,
      };

      if (!payload.tenant_id || !payload.agent_id) {
        return NextResponse.json(
          { ok: false, error: "tenant_id and agent_id are required" },
          { status: 400 }
        );
      }

      const { data, error } = await supabaseAdmin
        .from("agent_commission_rules")
        .upsert([payload], {
          onConflict: "tenant_id,agent_id,rule_name,applies_to",
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, data });
    }

    if (action === "mark_paid") {
      const id = String(body?.id || "");
      if (!id) {
        return NextResponse.json({ ok: false, error: "Commission entry id is required" }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from("agent_commission_entries")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true, data });
    }

    if (action === "approve") {
      const id = String(body?.id || "");
      if (!id) {
        return NextResponse.json({ ok: false, error: "Commission entry id is required" }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from("agent_commission_entries")
        .update({
          status: "approved",
        })
        .eq("id", id)
        .select()
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