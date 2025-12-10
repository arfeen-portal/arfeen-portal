import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateInvoicePdf } from '@/lib/billing/invoicePdf';

export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resendApiKey = process.env.RESEND_API_KEY!;
const fromEmail = process.env.INVOICE_FROM_EMAIL!;

const serverClient = () =>
  createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });

const resend = new Resend(resendApiKey);

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const invoiceId = context.params.id;
    const supabase = serverClient();

    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invError || !invoice) {
      return new Response(JSON.stringify({ error: 'Invoice not found' }), {
        status: 404
      });
    }

    if (!invoice.customer_email) {
      return new Response(JSON.stringify({ error: 'Customer email missing' }), {
        status: 400
      });
    }

    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('id', { ascending: true });

    if (itemsError) {
      console.error(itemsError);
    }

    const pdfBytes = await generateInvoicePdf(invoice, items || []);
    const pdfBase64 = Buffer.from(pdfBytes as any).toString('base64');

    const subject = `Invoice ${invoice.booking_reference || invoice.id} - Arfeen Travel`;

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://arfeentravel.com';
    const payUrl = `${appUrl}/billing/invoices/${invoice.id}`;

    const html = `
      <p>Assalamu Alaikum,</p>
      <p>Attached is your invoice from <strong>Arfeen Travel</strong>.</p>
      <p>You can also view and pay online here:</p>
      <p><a href="${payUrl}">${payUrl}</a></p>
      <p>JazakAllah khair,<br/>Arfeen Travel</p>
    `;

    await resend.emails.send({
      from: fromEmail,
      to: invoice.customer_email,
      subject,
      html,
      attachments: [
        {
          filename: `invoice-${invoice.id}.pdf`,
          content: pdfBase64,
          contentType: 'application/pdf'
        }
      ]
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500
    });
  }
}
