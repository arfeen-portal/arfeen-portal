import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = createClient();
  const body = await req.json();

  if (!body.agent_id) {
    return NextResponse.json({ error: 'Missing agent_id' }, { status: 400 });
  }

  const payload = {
    agent_id: body.agent_id,
    product_type: body.product_type || 'transport',
    commission_type: body.commission_type || 'percent',
    commission_value: body.commission_value ?? 0,
    valid_from: body.valid_from,
    valid_to: body.valid_to || null,
    notes: body.notes || null,
  };

  let data, error;
  if (body.id) {
    ({ data, error } = await supabase
      .from('agent_commission_rules')
      .update(payload)
      .eq('id', body.id)
      .select()
      .single());
  } else {
    ({ data, error } = await supabase
      .from('agent_commission_rules')
      .insert([payload])
      .select()
      .single());
  }

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }

  return NextResponse.json({ rule: data });
}
