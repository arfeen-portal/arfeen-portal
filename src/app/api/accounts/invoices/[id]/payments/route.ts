import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";
import { requireAccountant } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = {
  params: Promise<{ id: string }>;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, success: false, error: message }, { status });
}

function jsonOk(data: Record<string, unknown>, status = 200) {
  return NextResponse.json({ ok: true, success: true, ...data }, { status });
}

function toNumber(value: unknown) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function toStringOrNull(value: unknown) {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s || null;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const authUser = await requireAccountant();

    const { id } = await params;

    if (!id) {
      return jsonError("Invoice id is required.", 400);
    }

    const tenantId = authUser.tenantId;

    if (!tenantId) {
      return jsonError(
        authUser.role === "super_admin" || authUser.role === "admin"
          ? "tenant_id is missing from your user profile. Select/create a tenant before posting payments."
          : "Tenant not assigned to this user.",
        403
      );
    }

    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return jsonError("Supabase admin client not configured.", 500);
    }

    const body = await req.json().catch(() => ({}));
    const amount = toNumber(body.amount);

    if (amount <= 0) {
      return jsonError("Valid payment amount is required.", 400);
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("id,balance_amount,status,tenant_id")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (invoiceError || !invoice) {
      return jsonError("Invoice not found.", 404);
    }

    if (invoice.status === "cancelled") {
      return jsonError("Cannot post payment against cancelled invoice.", 400);
    }

    const { data, error } = await supabase
      .from("invoice_payments")
      .insert([
        {
          tenant_id: tenantId,
          invoice_id: id,
          payment_date:
            body.payment_date || new Date().toISOString().slice(0, 10),
          amount,
          payment_method: toStringOrNull(body.payment_method) || "cash",
          reference_no: toStringOrNull(body.reference_no),
          notes: toStringOrNull(body.notes),
          voucher_id: toStringOrNull(body.voucher_id),
          created_by: authUser.profileId,
        },
      ])
      .select("*")
      .single();

    if (error) {
      return jsonError(error.message, 500);
    }

    const { error: fnError } = await supabase.rpc("recompute_invoice_totals", {
      p_invoice_id: id,
    });

    if (fnError) {
      return jsonError(fnError.message, 500);
    }

    return jsonOk({
      data,
      tenant_id: tenantId,
      role: authUser.role,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Unauthorized.", 401);
  }
}