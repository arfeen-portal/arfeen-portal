import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";
import { requireAccountant } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ success: false, ok: false, error: message }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAccountant();
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return jsonError("Supabase admin not configured", 500);
    }

    const tenantId = authUser.tenantId;
    const isGlobalAdmin = authUser.role === "super_admin" || authUser.role === "admin";

    if (!tenantId && !isGlobalAdmin) {
      return jsonError("Tenant not assigned to this user.", 403);
    }

    let query = supabase
      .from("v_invoice_aging")
      .select("*")
      .gt("balance_amount", 0)
      .order("due_date", { ascending: true });

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      ok: true,
      rows: data || [],
      tenant_id: tenantId,
      role: authUser.role,
      scope: tenantId ? "tenant" : "global_admin",
    });
  } catch (error: any) {
    return jsonError(error?.message || "Failed to fetch aging report", 500);
  }
}