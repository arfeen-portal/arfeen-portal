import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

async function getTenantId(req: NextRequest, supabase: any) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) return { error: "Missing auth token", status: 401 };

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) return { error: "Invalid auth token", status: 401 };

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", userData.user.id)
    .single();

  if (!profile?.tenant_id) return { error: "Tenant not found", status: 403 };

  return {
    tenant_id: profile.tenant_id,
    user_id: userData.user.id,
    role: profile.role,
  };
}

function aiScores(input: any) {
  const totalPax = Number(input.total_pax || 0);
  const rate = Number(input.rate_per_person || 0);

  const wasteRisk = totalPax > 250 ? 72 : totalPax > 120 ? 48 : 22;
  const shortageRisk = totalPax > 300 ? 66 : totalPax > 150 ? 44 : 18;
  const qualityScore = rate >= 35 ? 92 : rate >= 25 ? 82 : rate >= 18 ? 70 : 58;

  return {
    ai_quality_score: qualityScore,
    ai_waste_risk: wasteRisk,
    ai_shortage_risk: shortageRisk,
  };
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminSafe();
    if (!supabase) return json({ ok: false, error: "Supabase admin not configured" }, 500);

    const auth = await getTenantId(req, supabase);
    if ("error" in auth) return json({ ok: false, error: auth.error }, auth.status);

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const city = url.searchParams.get("city");
    const q = url.searchParams.get("q");

    let query = supabase
      .from("hotel_khuraki_contracts")
      .select(`
        *,
        runs:hotel_khuraki_daily_runs(*),
        incidents:hotel_khuraki_incidents(*)
      `)
      .eq("tenant_id", auth.tenant_id)
      .order("created_at", { ascending: false });

    if (status && status !== "all") query = query.eq("status", status);
    if (city && city !== "all") query = query.eq("city", city);
    if (q) query = query.ilike("title", `%${q}%`);

    const { data, error } = await query;
    if (error) return json({ ok: false, error: error.message }, 500);

    const summary = {
      total_contracts: data?.length || 0,
      active: data?.filter((x: any) => x.status === "active").length || 0,
      total_pax: data?.reduce((s: number, x: any) => s + Number(x.total_pax || 0), 0) || 0,
      avg_quality:
        data?.length
          ? Math.round(data.reduce((s: number, x: any) => s + Number(x.ai_quality_score || 0), 0) / data.length)
          : 0,
      high_risk:
        data?.filter((x: any) => Number(x.ai_waste_risk) > 65 || Number(x.ai_shortage_risk) > 65).length || 0,
    };

    return json({ ok: true, summary, contracts: data || [] });
  } catch (e: any) {
    return json({ ok: false, error: e.message || "Unexpected error" }, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminSafe();
    if (!supabase) return json({ ok: false, error: "Supabase admin not configured" }, 500);

    const auth = await getTenantId(req, supabase);
    if ("error" in auth) return json({ ok: false, error: auth.error }, auth.status);

    const body = await req.json();

    if (!body.title || !body.city || !body.meal_type || !body.start_date || !body.end_date) {
      return json({ ok: false, error: "Required fields missing" }, 400);
    }

    const ai = aiScores(body);

    const payload = {
      tenant_id: auth.tenant_id,
      hotel_id: body.hotel_id || null,
      supplier_id: body.supplier_id || null,
      title: body.title,
      city: body.city,
      meal_type: body.meal_type,
      start_date: body.start_date,
      end_date: body.end_date,
      rate_per_person: Number(body.rate_per_person || 0),
      currency: body.currency || "SAR",
      total_pax: Number(body.total_pax || 0),
      status: body.status || "active",
      notes: body.notes || null,
      created_by: auth.user_id,
      ...ai,
    };

    const { data, error } = await supabase
      .from("hotel_khuraki_contracts")
      .insert(payload)
      .select("*")
      .single();

    if (error) return json({ ok: false, error: error.message }, 500);

    await supabase.from("hotel_khuraki_ai_logs").insert({
      tenant_id: auth.tenant_id,
      contract_id: data.id,
      log_type: "contract_created",
      score: ai.ai_quality_score,
      title: "AI Khuraki Analysis Created",
      detail: `Quality ${ai.ai_quality_score}%, waste risk ${ai.ai_waste_risk}%, shortage risk ${ai.ai_shortage_risk}%.`,
      action_required: ai.ai_waste_risk > 65 || ai.ai_shortage_risk > 65,
    });

    return json({ ok: true, contract: data });
  } catch (e: any) {
    return json({ ok: false, error: e.message || "Unexpected error" }, 500);
  }
}