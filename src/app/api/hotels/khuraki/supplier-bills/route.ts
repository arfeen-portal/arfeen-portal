import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";

function res(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

async function auth(req: NextRequest, supabase: any) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "").trim();
  if (!token) return { error: "Missing auth token", status: 401 };

  const { data: userData, error } = await supabase.auth.getUser(token);
  if (error || !userData?.user) return { error: "Invalid auth token", status: 401 };

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", userData.user.id)
    .single();

  if (!profile?.tenant_id) return { error: "Tenant not found", status: 403 };

  return { tenant_id: profile.tenant_id, user_id: userData.user.id };
}

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) return res({ ok: false, error: "Supabase admin not configured" }, 500);

  const a = await auth(req, supabase);
  if ("error" in a) return res({ ok: false, error: a.error }, a.status);

  const { data, error } = await supabase
    .from("hotel_khuraki_supplier_bills")
    .select("*")
    .eq("tenant_id", a.tenant_id)
    .order("created_at", { ascending: false });

  if (error) return res({ ok: false, error: error.message }, 500);

  return res({ ok: true, bills: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) return res({ ok: false, error: "Supabase admin not configured" }, 500);

  const a = await auth(req, supabase);
  if ("error" in a) return res({ ok: false, error: a.error }, a.status);

  const body = await req.json();

  const claimed = Number(body.claimed_pax || 0);
  const verified = Number(body.verified_pax || 0);
  const diff = claimed - verified;

  const ai_overbilling_risk =
    diff <= 0 ? 10 : diff <= 5 ? 35 : diff <= 15 ? 65 : 90;

  const { data, error } = await supabase
    .from("hotel_khuraki_supplier_bills")
    .insert({
      tenant_id: a.tenant_id,
      contract_id: body.contract_id || null,
      supplier_name: body.supplier_name,
      bill_no: body.bill_no || null,
      bill_date: body.bill_date || new Date().toISOString().slice(0, 10),
      from_date: body.from_date,
      to_date: body.to_date,
      claimed_pax: claimed,
      verified_pax: verified,
      rate_per_person: Number(body.rate_per_person || 0),
      status: body.status || "pending",
      ai_overbilling_risk,
      notes: body.notes || null,
    })
    .select("*")
    .single();

  if (error) return res({ ok: false, error: error.message }, 500);

  return res({ ok: true, bill: data });
}