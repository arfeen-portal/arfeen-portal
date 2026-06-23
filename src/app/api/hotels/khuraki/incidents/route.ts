import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";

function res(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

async function auth(req: NextRequest, supabase: any) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "").trim();
  if (!token) return { error: "Missing token", status: 401 };

  const { data: userData } = await supabase.auth.getUser(token);
  if (!userData?.user) return { error: "Invalid token", status: 401 };

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
    .from("hotel_khuraki_incidents")
    .select("*")
    .eq("tenant_id", a.tenant_id)
    .order("created_at", { ascending: false });

  if (error) return res({ ok: false, error: error.message }, 500);
  return res({ ok: true, incidents: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) return res({ ok: false, error: "Supabase admin not configured" }, 500);

  const a = await auth(req, supabase);
  if ("error" in a) return res({ ok: false, error: a.error }, a.status);

  const body = await req.json();

  const ai_recommendation =
    body.severity === "critical"
      ? "Immediately escalate to operations manager, call hotel/supplier, and freeze supplier bill approval until resolved."
      : "Track this incident, contact responsible staff, and attach resolution note before bill approval.";

  const { data, error } = await supabase
    .from("hotel_khuraki_incidents")
    .insert({
      tenant_id: a.tenant_id,
      contract_id: body.contract_id,
      incident_type: body.incident_type || "other",
      severity: body.severity || "medium",
      title: body.title,
      description: body.description || null,
      ai_recommendation,
    })
    .select("*")
    .single();

  if (error) return res({ ok: false, error: error.message }, 500);
  return res({ ok: true, incident: data });
}