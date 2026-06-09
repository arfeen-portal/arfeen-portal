import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";
import { requireAccountant } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type Params = {
  params: Promise<{ id: string }>;
};

type SendBody = {
  channel?: "email" | "whatsapp";
  recipient?: string;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json(
    { ok: false, success: false, error: message },
    { status }
  );
}

function jsonOk(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(
    { ok: true, success: true, ...data },
    { status }
  );
}

function money(value: unknown) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

function cleanPhone(value: string) {
  return String(value || "").replace(/\D/g, "");
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

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    return { ok: false, error: json?.message || "Email send failed" };
  }

  return { ok: true, id: json?.id || null };
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
          ? "tenant_id is missing from your user profile. Select/create a tenant before sending invoices."
          : "Tenant not assigned to this user.",
        403
      );
    }

    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return jsonError("Supabase admin client not configured.", 500);
    }

    const body = (await req.json().catch(() => ({}))) as SendBody;
    const channel = body.channel;

    if (!channel) {
      return jsonError("channel is required.", 400);
    }

    if (channel !== "email" && channel !== "whatsapp") {
      return jsonError("Unsupported channel.", 400);
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (invoiceError || !invoice) {
      return jsonError("Invoice not found.", 404);
    }

    const { data: items, error: itemsError } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", id)
      .eq("tenant_id", tenantId)
      .order("line_no", { ascending: true });

    if (itemsError) {
      return jsonError(itemsError.message, 500);
    }

    if (channel === "email") {
      const to = body.recipient || invoice.customer_email;

      if (!to) {
        return jsonError("No email recipient found.", 400);
      }

      const subject = `Invoice ${invoice.invoice_no}`;

      const html = `
        <div style="font-family:Arial,sans-serif;padding:24px">
          <h2>Invoice ${invoice.invoice_no}</h2>
          <p><strong>Customer:</strong> ${invoice.customer_name || "-"}</p>
          <p><strong>Issue Date:</strong> ${invoice.issue_date || invoice.invoice_date || "-"}</p>
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
              ${(items || [])
                .map(
                  (item: any) => `
                    <tr>
                      <td>${item.description || ""}</td>
                      <td align="right">${item.qty || 0}</td>
                      <td align="right">${item.unit_price || 0}</td>
                      <td align="right">${item.line_total || 0}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
          <h3 style="margin-top:20px">Total: ${invoice.currency || "PKR"} ${money(
            invoice.total_amount
          )}</h3>
          <h3>Paid: ${invoice.currency || "PKR"} ${money(invoice.paid_amount)}</h3>
          <h3>Balance: ${invoice.currency || "PKR"} ${money(
            invoice.balance_amount
          )}</h3>
        </div>
      `;

      const sendResult = await sendViaResend(to, subject, html);

      const { error: logError } = await supabase
        .from("invoice_delivery_logs")
        .insert([
          {
            tenant_id: tenantId,
            invoice_id: id,
            channel: "email",
            recipient: to,
            status: sendResult.ok ? "sent" : "failed",
            provider: "resend",
            provider_message_id: sendResult.ok
              ? String(sendResult.id || "")
              : null,
            error_message: sendResult.ok ? null : sendResult.error,
            payload: { subject },
            created_by: authUser.profileId,
          },
        ]);

      if (logError) {
        return jsonError(logError.message, 500);
      }

      if (!sendResult.ok) {
        return jsonError(sendResult.error || "Email send failed", 500);
      }

      await supabase
        .from("invoices")
        .update({ status: "sent" })
        .eq("id", id)
        .eq("tenant_id", tenantId);

      return jsonOk({
        channel: "email",
        tenant_id: tenantId,
      });
    }

    const phone = body.recipient || invoice.customer_phone;

    if (!phone) {
      return jsonError("No WhatsApp recipient found.", 400);
    }

    const text =
      `Invoice ${invoice.invoice_no}\n` +
      `Customer: ${invoice.customer_name || "-"}\n` +
      `Issue Date: ${invoice.issue_date || invoice.invoice_date || "-"}\n` +
      `Due Date: ${invoice.due_date || "-"}\n` +
      `Total: ${invoice.currency || "PKR"} ${money(invoice.total_amount)}\n` +
      `Paid: ${invoice.currency || "PKR"} ${money(invoice.paid_amount)}\n` +
      `Balance: ${invoice.currency || "PKR"} ${money(invoice.balance_amount)}`;

    const whatsappUrl = `https://wa.me/${cleanPhone(phone)}?text=${encodeURIComponent(
      text
    )}`;

    const { error: logError } = await supabase
      .from("invoice_delivery_logs")
      .insert([
        {
          tenant_id: tenantId,
          invoice_id: id,
          channel: "whatsapp",
          recipient: phone,
          status: "sent",
          provider: "wa_link",
          payload: { text, whatsappUrl },
          created_by: authUser.profileId,
        },
      ]);

    if (logError) {
      return jsonError(logError.message, 500);
    }

    await supabase
      .from("invoices")
      .update({ status: "sent" })
      .eq("id", id)
      .eq("tenant_id", tenantId);

    return jsonOk({
      channel: "whatsapp",
      whatsapp_url: whatsappUrl,
      tenant_id: tenantId,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unauthorized.",
      401
    );
  }
}