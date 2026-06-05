import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const updatedBy = body?.updated_by || null;

    const { data: invoice, error: invoiceError } = await supabase
      .from("finance_invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (invoiceError) throw invoiceError;

    if (invoice.status === "posted" || invoice.status === "paid" || invoice.status === "partial") {
      return NextResponse.json({ success: true, message: "Invoice already posted", invoice });
    }

    const { data: voucher, error: voucherError } = await supabase
      .from("finance_vouchers")
      .insert([
        {
          tenant_id: invoice.tenant_id,
          voucher_type: "invoice",
          voucher_date: invoice.invoice_date,
          narration: `Invoice ${invoice.invoice_no} - ${invoice.customer_name || invoice.agent_name || ""}`,
          status: "posted",
          created_by: updatedBy,
          updated_by: updatedBy,
        },
      ])
      .select()
      .single();

    if (voucherError) throw voucherError;

    const arAccountId =
      body?.ar_account_id ||
      null;

    const revenueAccountId =
      body?.revenue_account_id ||
      null;

    if (!arAccountId || !revenueAccountId) {
      await supabase
        .from("finance_invoices")
        .update({
          status: "posted",
          voucher_id: voucher.id,
          updated_by: updatedBy,
        })
        .eq("id", id);

      return NextResponse.json({
        success: true,
        warning: "Invoice marked posted, but voucher lines were skipped because ar_account_id / revenue_account_id were not provided.",
        voucher,
      });
    }

    const lines = [
      {
        voucher_id: voucher.id,
        account_id: arAccountId,
        debit: Number(invoice.total_amount || 0),
        credit: 0,
        description: `AR for ${invoice.invoice_no}`,
        line_no: 1,
      },
      {
        voucher_id: voucher.id,
        account_id: revenueAccountId,
        debit: 0,
        credit: Number(invoice.total_amount || 0),
        description: `Revenue for ${invoice.invoice_no}`,
        line_no: 2,
      },
    ];

    const { error: linesError } = await supabase
      .from("finance_voucher_lines")
      .insert(lines);

    if (linesError) throw linesError;

    const { error: invoiceUpdateError } = await supabase
      .from("finance_invoices")
      .update({
        status: "posted",
        voucher_id: voucher.id,
        updated_by: updatedBy,
      })
      .eq("id", id);

    if (invoiceUpdateError) throw invoiceUpdateError;

    return NextResponse.json({
      success: true,
      message: "Invoice posted successfully",
      voucher_id: voucher.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to post invoice" },
      { status: 500 }
    );
  }
}