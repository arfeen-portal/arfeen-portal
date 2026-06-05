import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Supabase admin client not configured." }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const tenantId = body.tenant_id || "";
  const runDate = body.run_date || todayISO();

  if (!tenantId) {
    return NextResponse.json({ success: false, error: "tenant_id is required." }, { status: 400 });
  }

  const { data: promises, error } = await supabase
    .from("finance_recovery_promises")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("status", "promised")
    .lt("promised_date", runDate);

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

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
        escalation_message: `Hi ${p.agent_name || p.customer_name || ""}, aapne payment ka promise kiya tha lekin system mein payment verified nahi hui. Please update payment status.`,
      });
    }
  }

  return NextResponse.json({
    success: true,
    checked: promises?.length || 0,
    broken_promises: updated.length,
    updated,
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenant_id = searchParams.get("tenant_id") || "";
  const fakeReq = new Request(req.url, {
    method: "POST",
    body: JSON.stringify({ tenant_id }),
  });

  return POST(fakeReq);
}