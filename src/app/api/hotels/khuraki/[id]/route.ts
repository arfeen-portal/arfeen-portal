import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const a = await auth();
    if ("error" in a) return res({ ok: false, error: a.error }, a.status);

    const { id } = await context.params;
    const supabase = getSupabaseAdminSafe();
    if (!supabase) return res({ ok: false, error: "Supabase admin not configured" }, 500);

    const { data: contract, error: contractError } = await supabase
      .from("hotel_khuraki_contracts")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", a.tenant_id)
      .maybeSingle();

    if (contractError) return res({ ok: false, error: contractError.message }, 500);
    if (!contract) return res({ ok: false, error: "Contract not found" }, 404);

    const [vouchers, incidents, supplierBills] = await Promise.all([
      supabase
        .from("hotel_khuraki_voucher_stays")
        .select("*")
        .eq("tenant_id", a.tenant_id)
        .eq("contract_id", id)
        .order("check_out_date", { ascending: true }),
      supabase
        .from("hotel_khuraki_incidents")
        .select("*")
        .eq("tenant_id", a.tenant_id)
        .eq("contract_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("hotel_khuraki_supplier_bills")
        .select("*")
        .eq("tenant_id", a.tenant_id)
        .eq("contract_id", id)
        .order("created_at", { ascending: false }),
    ]);

    if (vouchers.error) return res({ ok: false, error: vouchers.error.message }, 500);
    if (incidents.error) return res({ ok: false, error: incidents.error.message }, 500);
    if (supplierBills.error) return res({ ok: false, error: supplierBills.error.message }, 500);

    return res({
      ok: true,
      contract,
      vouchers: vouchers.data || [],
      incidents: incidents.data || [],
      supplier_bills: supplierBills.data || [],
    });
  } catch (e: any) {
    return res({ ok: false, error: e.message || "Unexpected error" }, 500);
  }
}
