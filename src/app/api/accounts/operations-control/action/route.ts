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
    user_id: userData.user.id,
    role: profile.role,
  };
}

export async function POST(req: NextRequest) {
  const a = await auth();
  if ("error" in a) return res({ ok: false, error: a.error }, a.status);

  const supabase = getSupabaseAdminSafe();
  if (!supabase) return res({ ok: false, error: "Supabase admin not configured" }, 500);

  const body = await req.json();
  const { id, action, note } = body;

  if (!id || !action) {
    return res({ ok: false, error: "id and action are required" }, 400);
  }

  const { data: oldRow, error: oldError } = await supabase
    .from("accounting_operations")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", a.tenant_id)
    .maybeSingle();

  if (oldError) return res({ ok: false, error: oldError.message }, 500);
  if (!oldRow) return res({ ok: false, error: "Record not found" }, 404);

  let updatePayload: any = {};
  let newStatus = oldRow.status;

  if (action === "approve") {
    newStatus = "approved";
    updatePayload = { status: "approved", approved_by: a.user_id, approved_at: new Date().toISOString() };
  }

  if (action === "post") {
    newStatus = "posted";
    updatePayload = { status: "posted", posted_by: a.user_id, posted_at: new Date().toISOString() };
  }

  if (action === "lock") {
    newStatus = "locked";
    updatePayload = { status: "locked", locked_by: a.user_id, locked_at: new Date().toISOString() };
  }

  if (action === "reject") {
    newStatus = "rejected";
    updatePayload = { status: "rejected", action_note: note || "Rejected" };
  }

  if (action === "resolve") {
    newStatus = "resolved";
    updatePayload = { status: "resolved", action_note: note || "Resolved" };
  }

  if (!Object.keys(updatePayload).length) {
    return res({ ok: false, error: "Invalid action" }, 400);
  }

  const { data, error } = await supabase
    .from("accounting_operations")
    .update(updatePayload)
    .eq("id", id)
    .eq("tenant_id", a.tenant_id)
    .select("*")
    .single();

  if (error) return res({ ok: false, error: error.message }, 500);

  await supabase.from("system_activity_logs").insert([
    {
      tenant_id: a.tenant_id,
      log_type: "posting_timeline",
      module: "operations_control",
      title: `Operation ${action}`,
      detail: `${oldRow.status} -> ${newStatus}`,
      actor: a.user_id,
      reference_no: oldRow.op_no || oldRow.reference_no || null,
    },
  ]);

  return res({ ok: true, operation: data });
}
