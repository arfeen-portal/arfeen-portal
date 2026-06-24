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
    .select("tenant_id")
    .eq("email", email)
    .maybeSingle();

  if (!profile?.tenant_id) return { error: "Tenant not found", status: 403 };

  return { tenant_id: profile.tenant_id, user_id: userData.user.id };
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
  const a = await auth();
  if ("error" in a) return res({ ok: false, error: a.error }, a.status);

  const supabase = getSupabaseAdminSafe();
  if (!supabase) return res({ ok: false, error: "Supabase admin not configured" }, 500);

  const { data, error } = await supabase
    .from("hotel_khuraki_incidents")
    .select("*")
    .eq("tenant_id", a.tenant_id)
    .order("created_at", { ascending: false });

  if (error) return res({ ok: false, error: error.message }, 500);
  return res({ ok: true, incidents: data || [] });
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

  const ai_recommendation =
    body.severity === "critical"
      ? "Immediately escalate to operations manager, call hotel/supplier, and freeze supplier bill approval until resolved."
      : "Track this incident, contact responsible staff, and attach resolution note before bill approval.";

  const { data, error } = await supabase
    .from("hotel_khuraki_incidents")
    .insert({
      tenant_id: a.tenant_id,
      contract_id: contractId,
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