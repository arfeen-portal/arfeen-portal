import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return jsonError("Supabase admin not configured", 500);

  const body = await req.json();
  const {
    tenant_id,
    payment_date,
    amount,
    payment_method,
    reference_no,
    notes,
    voucher_id,
    created_by,
  } = body;

  if (!tenant_id) return jsonError("tenant_id is required");
  if (!amount || Number(amount) <= 0) return jsonError("Valid payment amount is required");

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("id,balance_amount,status")
    .eq("id", id)
    .single();

  if (invoiceError) return jsonError(invoiceError.message, 500);
  if (invoice.status === "cancelled") return jsonError("Cannot post payment against cancelled invoice");

  const { data, error } = await supabase
    .from("invoice_payments")
    .insert([{
      tenant_id,
      invoice_id: id,
      payment_date: payment_date || new Date().toISOString().slice(0, 10),
      amount: Number(amount),
      payment_method: payment_method || "cash",
      reference_no: reference_no || null,
      notes: notes || null,
      voucher_id: voucher_id || null,
      created_by: created_by || null,
    }])
    .select("*")
    .single();

  if (error) return jsonError(error.message, 500);

  const { error: fnError } = await supabase.rpc("recompute_invoice_totals", {
    p_invoice_id: id,
  });

  if (fnError) return jsonError(fnError.message, 500);

  return NextResponse.json({ ok: true, data });
}