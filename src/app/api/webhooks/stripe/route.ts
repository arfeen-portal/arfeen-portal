import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeSecret = process.env.STRIPE_SECRET_KEY!;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const stripe = new Stripe(stripeSecret, {
  apiVersion: '2024-06-20' as any
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const serverClient = () =>
  createClient<any>(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });


export async function POST(req: NextRequest) {
  const supabase = serverClient();

  const sig = req.headers.get('stripe-signature') || '';
  const rawBody = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const invoiceId = session.metadata?.invoice_id;
        const tenantId = session.metadata?.tenant_id;

        if (!invoiceId || !tenantId) break;

        // 1) Payment row update
        const { error: payErr, data: payData } = await supabase
          .from('payments')
          .update({
            status: 'captured',
            paid_at: new Date().toISOString(),
            raw_response: session
          })
          .eq('gateway_payment_id', session.id)
          .select('*')
          .single();

        if (payErr) console.error(payErr);

        // 2) Invoice status → paid
        const { data: invoice, error: invErr } = await supabase
          .from('invoices')
          .update({ status: 'paid' })
          .eq('id', invoiceId)
          .select('*')
          .single();

        if (invErr) console.error(invErr);

        // 3) Ledger entry (credit)
        if (invoice) {
          const { error: ledgerErr } = await supabase
            .from('agent_ledger_entries')
            .insert({
              tenant_id: tenantId,
              agent_id: invoice.agent_id,
              invoice_id: invoiceId,
              payment_id: payData?.id,
              entry_type: 'credit',
              description: `Payment for invoice ${invoice.booking_reference || invoiceId}`,
              amount: invoice.total_billing,
              currency: invoice.billing_currency
            });

          if (ledgerErr) {
            console.error('Ledger insert error (payment):', ledgerErr);
          }
        }

        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 });
  }
}
