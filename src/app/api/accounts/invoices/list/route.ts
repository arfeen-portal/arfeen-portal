// src/app/api/accounts/invoices/list/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('invoices')
    .select(`
      id,
      invoice_number,
      total_amount,
      currency,
      status,
      issued_at,
      customer_id,
      agent_id,
      customers:customer_id ( full_name ),
      agents:agent_id ( name )
    `)
    .order('issued_at', { ascending: false });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}
