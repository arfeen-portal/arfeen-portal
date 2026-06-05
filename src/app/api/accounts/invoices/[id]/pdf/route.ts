import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function money(v: unknown) {
  return Number(v || 0).toFixed(2);
}

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return new NextResponse("Supabase admin not configured", { status: 500 });
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .single();

  if (invoiceError || !invoice) {
    return new NextResponse("Invoice not found", { status: 404 });
  }

  const { data: items } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", id)
    .order("line_no", { ascending: true });

  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Invoice ${invoice.invoice_no}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 30px; color: #111; }
        .top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }
        .title { font-size:28px; font-weight:700; }
        .muted { color:#666; font-size:13px; }
        .card { border:1px solid #ddd; border-radius:12px; padding:16px; margin-bottom:20px; }
        table { width:100%; border-collapse: collapse; }
        th, td { border-bottom:1px solid #eee; padding:12px 8px; text-align:left; }
        th:last-child, td:last-child { text-align:right; }
        .totals { width:320px; margin-left:auto; margin-top:20px; }
        .totals div { display:flex; justify-content:space-between; padding:6px 0; }
        .grand { font-size:18px; font-weight:700; border-top:1px solid #ddd; margin-top:8px; padding-top:10px; }
      </style>
    </head>
    <body>
      <div class="top">
        <div>
          <div class="title">Invoice</div>
          <div class="muted">Invoice No: ${invoice.invoice_no}</div>
          <div class="muted">Issue Date: ${invoice.issue_date}</div>
          <div class="muted">Due Date: ${invoice.due_date || "-"}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:20px;font-weight:700">Arfeen Travel</div>
          <div class="muted">Billing Document</div>
        </div>
      </div>

      <div class="card">
        <strong>Bill To</strong>
        <div style="margin-top:8px">${invoice.customer_name}</div>
        <div class="muted">${invoice.customer_email || ""}</div>
        <div class="muted">${invoice.customer_phone || ""}</div>
        <div class="muted">${invoice.billing_address || ""}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${(items || []).map((item) => `
            <tr>
              <td>${item.description}</td>
              <td>${item.qty}</td>
              <td>${invoice.currency} ${money(item.unit_price)}</td>
              <td>${invoice.currency} ${money(item.line_total)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <div class="totals">
        <div><span>Subtotal</span><span>${invoice.currency} ${money(invoice.subtotal)}</span></div>
        <div><span>Discount</span><span>${invoice.currency} ${money(invoice.discount)}</span></div>
        <div><span>Tax</span><span>${invoice.currency} ${money(invoice.tax_amount)}</span></div>
        <div><span>Paid</span><span>${invoice.currency} ${money(invoice.paid_amount)}</span></div>
        <div class="grand"><span>Balance</span><span>${invoice.currency} ${money(invoice.balance_amount)}</span></div>
      </div>

      ${invoice.notes ? `<div class="card" style="margin-top:24px"><strong>Notes</strong><div style="margin-top:8px">${invoice.notes}</div></div>` : ""}

      <script>
        window.onload = () => window.print();
      </script>
    </body>
  </html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}