import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";

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

  return { tenant_id: profile.tenant_id, user_id: userData.user.id };
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const a = await auth();
    if ("error" in a) return res({ ok: false, error: a.error }, a.status);

    const supabase = getSupabaseAdminSafe();
    if (!supabase) return res({ ok: false, error: "Supabase admin not configured" }, 500);

    const body = await req.json();
    const action = body.action;

    let patch: any = { updated_at: new Date().toISOString() };

    if (action === "check_in") {
      patch.status = "checked_in";
      patch.check_in_time = new Date().toISOString();
      patch.room_no = body.room_no || null;
    }

    if (action === "check_out") {
      patch.status = "checked_out";
      patch.check_out_time = new Date().toISOString();
      patch.checkout_call_status = "resolved";
    }

    if (action === "call_update") {
      patch.checkout_call_status = body.checkout_call_status || "called";
      patch.checkout_call_notes = body.checkout_call_notes || null;
      patch.last_called_at = new Date().toISOString();
    }

    if (action === "extend") {
      patch.status = "extended";
      patch.check_out_date = body.check_out_date;
      patch.checkout_call_status = "pending";
    }

    if (!action) return res({ ok: false, error: "Missing action" }, 400);

    const { data, error } = await supabase
      .from("hotel_khuraki_voucher_stays")
      .update(patch)
      .eq("id", id)
      .eq("tenant_id", a.tenant_id)
      .select("*")
      .single();

    if (error) return res({ ok: false, error: error.message }, 500);

    return res({ ok: true, voucher: data });
  } catch (e: any) {
    return res({ ok: false, error: e.message || "Unexpected error" }, 500);
  }
}