import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";
import { requireAccountant } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, ok: false, error: message }, { status });
}

async function runReconcile(runDate: string) {
  const authUser = await requireAccountant();

  const supabase = getSupabaseAdminSafe();
  if (!supabase) {
    return jsonError("Supabase admin client not configured.", 500);
  }

  const tenantId = authUser.tenantId;
  const isGlobalAdmin = authUser.role === "super_admin" || authUser.role === "admin";

  if (!tenantId && !isGlobalAdmin) {
    return jsonError("Tenant not assigned to this user.", 403);
  }

  let query = supabase
    .from("finance_recovery_promises")
    .select("*")
    .eq("status", "promised")
    .lt("promised_date", runDate);

  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  const { data: promises, error } = await query;

  if (error) {
    return jsonError(error.message, 500);
  }

  const updated: any[] = [];

  for (const p of promises || []) {
    const brokenCount = Number(p.broken_count || 0) + 1;
    const legalTriggered = brokenCount >= 3;

    const { error: upErr } = await supabase
      .from("finance_recovery_promises")
      .update({
        status: "broken",
        recovery_stage: legalTriggered ? "legal_watch" : "broken_promise",
        broken_count: brokenCount,
        escalation_count: Number(p.escalation_count || 0) + 1,
        legal_triggered: legalTriggered,
        blacklist_recommended: legalTriggered,
        last_escalated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: legalTriggered
          ? "AI legal/litigation alert: 3 broken promises detected."
          : "Promise date passed without verified payment.",
      })
      .eq("id", p.id);

    if (!upErr) {
      updated.push({
        id: p.id,
        invoice_no: p.invoice_no,
        phone: p.phone,
        agent_name: p.agent_name,
        broken_count: brokenCount,
        legal_triggered: legalTriggered,
        escalation_message: `Hi ${
          p.agent_name || p.customer_name || ""
        }, aapne payment ka promise kiya tha lekin system mein payment verified nahi hui. Please update payment status.`,
      });
    }
  }

  return NextResponse.json({
    success: true,
    ok: true,
    checked: promises?.length || 0,
    broken_promises: updated.length,
    updated,
    tenant_id: tenantId,
    role: authUser.role,
    scope: tenantId ? "tenant" : "global_admin",
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const runDate = body.run_date || todayISO();

    return await runReconcile(runDate);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unauthorized.", 401);
  }
}

export async function GET() {
  try {
    return await runReconcile(todayISO());
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unauthorized.", 401);
  }
}