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

export async function GET(req: NextRequest) {
  const a = await auth();
  if ("error" in a) return res({ ok: false, error: a.error }, a.status);

  const supabase = getSupabaseAdminSafe();
  if (!supabase) return res({ ok: false, error: "Supabase admin not configured" }, 500);

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "all";
  const status = url.searchParams.get("status") || "all";

  let query = supabase
    .from("accounting_operations")
    .select("*")
    .eq("tenant_id", a.tenant_id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (type !== "all") query = query.eq("op_type", type);
  if (status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return res({ ok: false, error: error.message }, 500);

  return res({ ok: true, operations: data || [] });
}

export async function POST(req: NextRequest) {
  const a = await auth();
  if ("error" in a) return res({ ok: false, error: a.error }, a.status);

  const supabase = getSupabaseAdminSafe();
  if (!supabase) return res({ ok: false, error: "Supabase admin not configured" }, 500);

  const body = await req.json();

  if (!body.title) {
    return res({ ok: false, error: "Title is required" }, 400);
  }

  const payload = {
    tenant_id: a.tenant_id,
    op_type: body.op_type || "roznamcha_posting",
    title: body.title,
    reference_no: body.reference_no || null,
    consultant_name: body.consultant_name || null,
    supplier_name: body.supplier_name || null,
    amount: Number(body.amount || 0),
    currency: body.currency || "PKR",
    debit_account: body.debit_account || null,
    credit_account: body.credit_account || null,
    priority: body.priority || "normal",
    issue_reason: body.issue_reason || null,
    action_note: body.action_note || null,
    status: "pending",
    created_by: a.user_id,
  };

  const { data, error } = await supabase
    .from("accounting_operations")
    .insert(payload)
    .select("*")
    .single();

  if (error) return res({ ok: false, error: error.message }, 500);

  await supabase.from("system_activity_logs").insert([
    {
      tenant_id: a.tenant_id,
      log_type: "operation_created",
      module: "operations_control",
      title: "Operation created",
      detail: body.title,
      actor: a.user_id,
      reference_no: data.op_no || data.reference_no || null,
    },
  ]);

  return res({ ok: true, operation: data });
}
