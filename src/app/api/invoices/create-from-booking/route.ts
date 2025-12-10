import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getLatestRate } from '@/lib/billing/getLatestRate';
import { calcInvoiceTotals } from '@/lib/billing/calcInvoiceTotals';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const serverClient = () =>
  createClient<any>(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });

export async function POST(req: NextRequest) {
  try {
    const supabase = serverClient();
    const body = await req.json();

    const {
      tenantId,
      agentId,
      bookingReference,
      bookingType,
      baseCurrency = 'SAR',
      taxPercent = 0,
      items, // [{ description, quantity, unitPriceBase }]
      customerName,
      customerEmail,
      notes,
      dueDate
    } = body;

    // 1) Agent billing currency
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('billing_currency')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found or missing billing currency' },
        { status: 400 }
      );
    }

    const billingCurrency = agent.billing_currency || baseCurrency;

    // 2) Totals
    const { subtotalBase, taxBase, totalBase } = calcInvoiceTotals(
      items,
      taxPercent
    );

    // 3) Conversion
    const conversionRate = await getLatestRate(baseCurrency, billingCurrency);
    const totalBilling = Number((totalBase * conversionRate).toFixed(2));

    // 4) Insert invoice
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .insert({
        tenant_id: tenantId,
        agent_id: agentId,
        booking_reference: bookingReference,
        booking_type: bookingType,
        status: 'sent',
        base_currency: baseCurrency,
        billing_currency: billingCurrency,
        conversion_rate: conversionRate,
        subtotal_base: subtotalBase,
        tax_base: taxBase,
        total_base: totalBase,
        total_billing: totalBilling,
        customer_name: customerName,
        customer_email: customerEmail,
        notes,
        due_date: dueDate
      })
      .select('*')
      .single();

    if (invError || !invoice) {
      console.error(invError);
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }

    // 5) Insert items
    const itemsPayload = items.map((item: any) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price_base: item.unitPriceBase,
      total_base: Number((item.quantity * item.unitPriceBase).toFixed(2)),
      meta: item.meta || {}
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsPayload);

    if (itemsError) {
      console.error(itemsError);
      return NextResponse.json(
        { error: 'Invoice created but items failed' },
        { status: 500 }
      );
    }

    // 6) Ledger entry (debit → agent hamare payable)
    const { error: ledgerError } = await supabase
      .from('agent_ledger_entries')
      .insert({
        tenant_id: tenantId,
        agent_id: agentId,
        invoice_id: invoice.id,
        entry_type: 'debit',
        description: `Invoice ${bookingReference || invoice.id}`,
        amount: totalBilling,
        currency: billingCurrency
      });

    if (ledgerError) {
      console.error('Ledger insert error (invoice):', ledgerError);
    }

    return NextResponse.json({ invoice, items: itemsPayload }, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
