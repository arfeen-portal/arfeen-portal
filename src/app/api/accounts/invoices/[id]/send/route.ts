import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

async function sendViaResend(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INVOICE_FROM_EMAIL || "billing@arfeentravel.com";

  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY missing" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    return { ok: false, error: json?.message || "Email send failed" };
  }

  return { ok: true, id: json?.id || null };
}

type SendBody = {
  tenant_id: string;
  channel: "email" | "whatsapp";
  recipient?: string;
  created_by?: string | null;
};

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return jsonError("Supabase admin not configured", 500);

  const body = (await req.json()) as SendBody;
  const { tenant_id, channel, recipient, created_by } = body;

  if (!tenant_id) return jsonError("tenant_id is required");
  if (!channel) return jsonError("channel is required");

  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .single();

  if (invoiceError) return jsonError(invoiceError.message, 500);

  const { data: items, error: itemsError } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", id)
    .order("line_no", { ascending: true });

  if (itemsError) return jsonError(itemsError.message, 500);

  if (channel === "email") {
    const to = recipient || invoice.customer_email;
    if (!to) return jsonError("No email recipient found");

    const html = `
      <div style="font-family:Arial,sans-serif;padding:24px">
        <h2>Invoice ${invoice.invoice_no}</h2>
        <p><strong>Customer:</strong> ${invoice.customer_name}</p>
        <p><strong>Issue Date:</strong> ${invoice.issue_date}</p>
        <p><strong>Due Date:</strong> ${invoice.due_date || "-"}</p>
        <hr />
        <table cellpadding="8" cellspacing="0" border="1" style="border-collapse:collapse;width:100%">
          <thead>
            <tr>
              <th align="left">Description</th>
              <th align="right">Qty</th>
              <th align="right">Unit Price</th>
              <th align="right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${items?.map((item) => `
              <tr>
                <td>${item.description}</td>
                <td align="right">${item.qty}</td>
                <td align="right">${item.unit_price}</td>
                <td align="right">${item.line_total}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <h3 style="margin-top:20px">Total: ${invoice.currency} ${Number(invoice.total_amount).toFixed(2)}</h3>
        <h3>Paid: ${invoice.currency} ${Number(invoice.paid_amount).toFixed(2)}</h3>
        <h3>Balance: ${invoice.currency} ${Number(invoice.balance_amount).toFixed(2)}</h3>
      </div>
    `;

    const sendResult = await sendViaResend(to, `Invoice ${invoice.invoice_no}`, html);

    const { error: logError } = await supabase.from("invoice_delivery_logs").insert([{
      tenant_id,
      invoice_id: id,
      channel: "email",
      recipient: to,
      status: sendResult.ok ? "sent" : "failed",
      provider: "resend",
      provider_message_id: sendResult.ok ? String(sendResult.id || "") : null,
      error_message: sendResult.ok ? null : sendResult.error,
      payload: { subject: `Invoice ${invoice.invoice_no}` },
      created_by: created_by || null,
    }]);

    if (logError) return jsonError(logError.message, 500);

    if (!sendResult.ok) {
      return jsonError(sendResult.error || "Email send failed", 500);
    }

    await supabase.from("invoices").update({ status: "sent" }).eq("id", id);

    return NextResponse.json({ ok: true, channel: "email" });
  }

  if (channel === "whatsapp") {
    const phone = recipient || invoice.customer_phone;
    if (!phone) return jsonError("No WhatsApp recipient found");

    const text =
      `Invoice ${invoice.invoice_no}\n` +
      `Customer: ${invoice.customer_name}\n` +
      `Issue Date: ${invoice.issue_date}\n` +
      `Due Date: ${invoice.due_date || "-"}\n` +
      `Total: ${invoice.currency} ${Number(invoice.total_amount).toFixed(2)}\n` +
      `Paid: ${invoice.currency} ${Number(invoice.paid_amount).toFixed(2)}\n` +
      `Balance: ${invoice.currency} ${Number(invoice.balance_amount).toFixed(2)}`;

    const whatsappUrl = `https://wa.me/${String(phone).replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

    const { error: logError } = await supabase.from("invoice_delivery_logs").insert([{
      tenant_id,
      invoice_id: id,
      channel: "whatsapp",
      recipient: phone,
      status: "sent",
      provider: "wa_link",
      payload: { text, whatsappUrl },
      created_by: created_by || null,
    }]);

    if (logError) return jsonError(logError.message, 500);

    await supabase.from("invoices").update({ status: "sent" }).eq("id", id);

    return NextResponse.json({
      ok: true,
      channel: "whatsapp",
      whatsapp_url: whatsappUrl,
    });
  }

  return jsonError("Unsupported channel");
}