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

  return { tenant_id: profile.tenant_id, user_id: userData.user.id, role: profile.role };
}

function riskScore(body: any) {
  const pax = Number(body.pax || 1);
  const hasPhone = Boolean(body.customer_phone || body.whatsapp_phone);
  const days = Math.ceil(
    (new Date(body.check_out_date).getTime() - new Date(body.check_in_date).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  let checkout = 20;
  let khuraki = 20;

  if (!hasPhone) checkout += 45;
  if (pax >= 5) khuraki += 25;
  if (days >= 10) khuraki += 20;
  if (!body.room_no) checkout += 10;

  return {
    ai_checkout_risk: Math.min(checkout, 95),
    ai_khuraki_risk: Math.min(khuraki, 95),
  };
}

async function verifyContract(
  supabase: any,
  contractId: string | null,
  tenantId: string
) {
  if (!contractId) return { ok: true as const };

  const { data, error } = await supabase
    .from("hotel_khuraki_contracts")
    .select("id")
    .eq("id", contractId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (error) return { ok: false as const, error: error.message, status: 500 };
  if (!data) return { ok: false as const, error: "Contract not found", status: 404 };

  return { ok: true as const };
}

export async function GET(req: NextRequest) {
  try {
    const a = await auth();
    if ("error" in a) return res({ ok: false, error: a.error }, a.status);

    const supabase = getSupabaseAdminSafe();
    if (!supabase) return res({ ok: false, error: "Supabase admin not configured" }, 500);

    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "all";
    const q = url.searchParams.get("q") || "";
    const checkoutDue = url.searchParams.get("checkout_due") === "1";

    let query = supabase
      .from("hotel_khuraki_voucher_stays")
      .select("*")
      .eq("tenant_id", a.tenant_id)
      .order("check_out_date", { ascending: true });

    if (status !== "all") query = query.eq("status", status);

    if (q) {
      query = query.or(
        `voucher_no.ilike.%${q}%,customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,hotel_name.ilike.%${q}%`
      );
    }

    if (checkoutDue) {
      const today = new Date().toISOString().slice(0, 10);
      query = query
        .lte("check_out_date", today)
        .in("status", ["checked_in", "checkout_due", "extended"])
        .in("checkout_call_status", ["pending", "not_answered"]);
    }

    const { data, error } = await query;
    if (error) return res({ ok: false, error: error.message }, 500);

    return res({ ok: true, vouchers: data || [] });
  } catch (e: any) {
    return res({ ok: false, error: e.message || "Unexpected error" }, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const a = await auth();
    if ("error" in a) return res({ ok: false, error: a.error }, a.status);

    const supabase = getSupabaseAdminSafe();
    if (!supabase) return res({ ok: false, error: "Supabase admin not configured" }, 500);

    const body = await req.json();

    if (!body.voucher_no || !body.customer_name || !body.hotel_name || !body.check_in_date || !body.check_out_date) {
      return res({ ok: false, error: "Required fields missing" }, 400);
    }

    const contractId = body.contract_id || null;
    const contractCheck = await verifyContract(supabase, contractId, a.tenant_id);
    if (!contractCheck.ok) return res({ ok: false, error: contractCheck.error }, contractCheck.status);

    const ai = riskScore(body);

    const payload = {
      tenant_id: a.tenant_id,
      contract_id: contractId,
      booking_id: body.booking_id || null,
      voucher_no: body.voucher_no,
      customer_name: body.customer_name,
      customer_phone: body.customer_phone || null,
      whatsapp_phone: body.whatsapp_phone || body.customer_phone || null,
      hotel_name: body.hotel_name,
      city: body.city || "makkah",
      room_no: body.room_no || null,
      pax: Number(body.pax || 1),
      check_in_date: body.check_in_date,
      check_out_date: body.check_out_date,
      meal_plan: body.meal_plan || "full_board",
      special_notes: body.special_notes || null,
      status: body.status || "expected",
      ...ai,
    };

    const { data, error } = await supabase
      .from("hotel_khuraki_voucher_stays")
      .insert(payload)
      .select("*")
      .single();

    if (error) return res({ ok: false, error: error.message }, 500);

    await supabase.from("hotel_khuraki_ai_logs").insert({
      tenant_id: a.tenant_id,
      contract_id: body.contract_id || null,
      log_type: "voucher_created",
      score: ai.ai_checkout_risk,
      title: "Voucher Stay AI Risk Created",
      detail: `Voucher ${body.voucher_no}: checkout risk ${ai.ai_checkout_risk}%, khuraki risk ${ai.ai_khuraki_risk}%.`,
      action_required: ai.ai_checkout_risk > 60 || ai.ai_khuraki_risk > 60,
    });

    return res({ ok: true, voucher: data });
  } catch (e: any) {
    return res({ ok: false, error: e.message || "Unexpected error" }, 500);
  }
}