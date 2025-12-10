import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeSecret = process.env.STRIPE_SECRET_KEY!;
const stripe = new Stripe(stripeSecret, {
  apiVersion: '2024-06-20' as any
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const serverClient = () =>
  createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });

export async function POST(req: NextRequest) {
  try {
    const supabase = serverClient();
    const { invoiceId, tenantId } = await req.json();

    // 1) Load invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 });
    }

    const amount = invoice.total_billing; // in billing currency
    const currency = invoice.billing_currency.toLowerCase(); // 'sar', 'pkr', etc.

    // Stripe amount should be in smallest unit (e.g. cents). 
    // For SAR/PKR with 2 decimals: multiply by 100
    const stripeAmount = Math.round(Number(amount) * 100);

    // 2) Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/success?invoiceId=${invoiceId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/cancel?invoiceId=${invoiceId}`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: stripeAmount,
            product_data: {
              name: `Invoice ${invoiceId}`,
              description: invoice.booking_reference || 'Arfeen Travel Booking'
            }
          }
        }
      ],
      metadata: {
        invoice_id: invoiceId,
        tenant_id: tenantId
      }
    });

    // 3) Create payment record (initiated)
    const { error: payError } = await supabase.from('payments').insert({
      tenant_id: tenantId,
      invoice_id: invoiceId,
      gateway: 'stripe',
      gateway_payment_id: session.id,
      amount,
      currency: invoice.billing_currency,
      status: 'initiated'
    });

    if (payError) {
      console.error(payError);
    }

    return NextResponse.json({ checkoutUrl: session.url }, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
