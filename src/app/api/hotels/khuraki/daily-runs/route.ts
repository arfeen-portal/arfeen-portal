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

async function verifyContract(
  supabase: any,
  contractId: string | null,
  tenantId: string
) {
  if (!contractId) return { ok: false as const, error: "Contract is required", status: 400 };

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

function num(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET(req: NextRequest) {
  const a = await auth();
  if ("error" in a) return res({ ok: false, error: a.error }, a.status);

  const supabase = getSupabaseAdminSafe();
  if (!supabase) return res({ ok: false, error: "Supabase admin not configured" }, 500);

  const url = new URL(req.url);
  const contractId = url.searchParams.get("contract_id");
  const status = url.searchParams.get("status");
  const runDate = url.searchParams.get("run_date");

  let query = supabase
    .from("hotel_khuraki_daily_runs")
    .select("*")
    .eq("tenant_id", a.tenant_id)
    .order("run_date", { ascending: false });

  if (contractId) query = query.eq("contract_id", contractId);
  if (status && status !== "all") query = query.eq("status", status);
  if (runDate) query = query.eq("run_date", runDate);

  const { data, error } = await query;
  if (error) return res({ ok: false, error: error.message }, 500);

  return res({ ok: true, daily_runs: data || [] });
}

export async function POST(req: NextRequest) {
  const a = await auth();
  if ("error" in a) return res({ ok: false, error: a.error }, a.status);

  const supabase = getSupabaseAdminSafe();
  if (!supabase) return res({ ok: false, error: "Supabase admin not configured" }, 500);

  const body = await req.json();
  const contractId = body.contract_id || null;
  const contractCheck = await verifyContract(supabase, contractId, a.tenant_id);
  if (!contractCheck.ok) return res({ ok: false, error: contractCheck.error }, contractCheck.status);

  if (!body.run_date || !body.meal_type) {
    return res({ ok: false, error: "run_date and meal_type are required" }, 400);
  }

  const payload = {
    tenant_id: a.tenant_id,
    contract_id: contractId,
    run_date: body.run_date,
    meal_type: body.meal_type,
    planned_pax: num(body.planned_pax),
    actual_pax: num(body.actual_pax),
    meals_served: num(body.meals_served),
    shortage_count: num(body.shortage_count),
    waste_count: num(body.waste_count),
    quality_note: body.quality_note || null,
    supplier_status: body.supplier_status || "pending",
    staff_id: body.staff_id || body.checker_id || null,
    status: body.status || "pending",
  };

  const { data, error } = await supabase
    .from("hotel_khuraki_daily_runs")
    .insert(payload)
    .select("*")
    .single();

  if (error) return res({ ok: false, error: error.message }, 500);

  return res({ ok: true, daily_run: data });
}

export async function PATCH(req: NextRequest) {
  const a = await auth();
  if ("error" in a) return res({ ok: false, error: a.error }, a.status);

  const supabase = getSupabaseAdminSafe();
  if (!supabase) return res({ ok: false, error: "Supabase admin not configured" }, 500);

  const body = await req.json();
  if (!body.id) return res({ ok: false, error: "Daily run id is required" }, 400);

  const { data: existing, error: existingError } = await supabase
    .from("hotel_khuraki_daily_runs")
    .select("id")
    .eq("id", body.id)
    .eq("tenant_id", a.tenant_id)
    .maybeSingle();

  if (existingError) return res({ ok: false, error: existingError.message }, 500);
  if (!existing) return res({ ok: false, error: "Daily run not found" }, 404);

  const patch: Record<string, unknown> = {};

  [
    "meal_type",
    "run_date",
    "quality_note",
    "supplier_status",
    "status",
    "staff_id",
  ].forEach((key) => {
    if (body[key] !== undefined) patch[key] = body[key] || null;
  });

  [
    "planned_pax",
    "actual_pax",
    "meals_served",
    "shortage_count",
    "waste_count",
  ].forEach((key) => {
    if (body[key] !== undefined) patch[key] = num(body[key]);
  });

  const { data, error } = await supabase
    .from("hotel_khuraki_daily_runs")
    .update(patch)
    .eq("id", body.id)
    .eq("tenant_id", a.tenant_id)
    .select("*")
    .single();

  if (error) return res({ ok: false, error: error.message }, 500);

  return res({ ok: true, daily_run: data });
}
