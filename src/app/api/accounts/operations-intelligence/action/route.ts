import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });

  const body = await req.json();
  const { id, action, actor, note } = body;

  const { data: oldRow, error: oldError } = await supabase
    .from("accounting_operations")
    .select("*")
    .eq("id", id)
    .single();

  if (oldError || !oldRow) {
    return NextResponse.json({ error: oldError?.message || "Record not found" }, { status: 404 });
  }

  let updatePayload: any = {};
  let newStatus = oldRow.status;

  if (action === "approve") {
    newStatus = "approved";
    updatePayload = { status: "approved", approved_by: actor || "admin", approved_at: new Date().toISOString() };
  }

  if (action === "post") {
    newStatus = "posted";
    updatePayload = { status: "posted", posted_by: actor || "admin", posted_at: new Date().toISOString() };
  }

  if (action === "lock") {
    newStatus = "locked";
    updatePayload = { status: "locked", locked_by: actor || "admin", locked_at: new Date().toISOString() };
  }

  if (action === "reject") {
    newStatus = "rejected";
    updatePayload = { status: "rejected", action_note: note || "Rejected" };
  }

  if (action === "resolve") {
    newStatus = "resolved";
    updatePayload = { status: "resolved", action_note: note || "Resolved" };
  }

  const { data, error } = await supabase
    .from("accounting_operations")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("system_activity_logs").insert([{
    log_type: "posting_timeline",
    module: "operations_control",
    title: `Operation ${action}`,
    detail: `${oldRow.status} → ${newStatus}`,
    actor: actor || "admin",
    reference_no: oldRow.op_no,
  }]);

  return NextResponse.json({ operation: data });
}