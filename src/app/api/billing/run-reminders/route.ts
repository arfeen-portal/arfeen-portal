import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resendApiKey = process.env.RESEND_API_KEY!;
const fromEmail = process.env.INVOICE_FROM_EMAIL!;
const recoveryEmail = process.env.RECOVERY_TEAM_EMAIL!;

const serverClient = () =>
  createClient<any>(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });

const resend = new Resend(resendApiKey);

export async function POST(req: NextRequest) {
  try {
    const supabase = serverClient();

    // Overdue invoices: due_date < today, not paid/cancelled
    const todayIso = new Date().toISOString().slice(0, 10);

    const { data: invoicesRaw, error } = await supabase
      .from('invoices')
      .select(
        `
        id,
        tenant_id,
        agent_id,
        booking_reference,
        status,
        total_billing,
        billing_currency,
        due_date,
        last_reminder_at,
        reminder_count
      `
      )
      .in('status', ['sent', 'partially_paid'])
      .lt('due_date', todayIso)
      .or(
        'last_reminder_at.is.null,last_reminder_at.lt.' +
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      ); // at least 1 day gap

    if (error) {
      console.error(error);
      return NextResponse.json({ error: 'Failed to load invoices' }, { status: 500 });
    }

    const invoices = (invoicesRaw || []) as any[];

    if (!invoices.length) {
      return NextResponse.json({ message: 'No overdue invoices to remind.' });
    }

    // Agents info (unique agent IDs without Set iteration)
    const agentIds: string[] = [];
    for (const inv of invoices) {
      if (inv.agent_id && !agentIds.includes(inv.agent_id)) {
        agentIds.push(inv.agent_id);
      }
    }

    const { data: agents, error: agentErr } = await supabase
      .from('agents')
      .select('id, name, email, phone')
      .in('id', agentIds);

    if (agentErr) {
      console.error(agentErr);
    }

    const agentsById: Record<string, any> = {};
    (agents || []).forEach((a: any) => {
      agentsById[a.id] = a;
    });

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://arfeentravel.com';

    // --- Send emails sequentially for clarity ---
    for (const inv of invoices) {
      const agent = agentsById[inv.agent_id];
      const invoiceUrl = `${appUrl}/billing/invoices/${inv.id}`;

      const subject = `Overdue Invoice - ${inv.booking_reference || inv.id}`;

      const html = `
        <p>Assalamu Alaikum ${agent?.name || ''},</p>
        <p>Aap ki ek invoice abhi tak <strong>pending</strong> hai.</p>
        <ul>
          <li><strong>Invoice:</strong> ${inv.booking_reference || inv.id}</li>
          <li><strong>Amount:</strong> ${(inv.total_billing || 0).toFixed(2)} ${
        inv.billing_currency
      }</li>
          <li><strong>Due Date:</strong> ${
            inv.due_date || ''
          }</li>
        </ul>
        <p>Kirpya jaldi payment complete kar dein. Online view & pay link:</p>
        <p><a href="${invoiceUrl}">${invoiceUrl}</a></p>
        <p>JazakAllah khair,<br/>Arfeen Travel</p>
      `;

      const toList: string[] = [];
      if (agent?.email) toList.push(agent.email);
      if (!toList.length) toList.push(recoveryEmail);

      try {
        await resend.emails.send({
          from: fromEmail,
          to: toList,
          subject,
          html
        });

        await supabase
          .from('invoices')
          .update({
            last_reminder_at: new Date().toISOString(),
            reminder_count: (inv.reminder_count || 0) + 1
          })
          .eq('id', inv.id);
      } catch (e) {
        console.error('Reminder email failed for invoice', inv.id, e);
      }
    }

    return NextResponse.json({ ok: true, count: invoices.length }, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
