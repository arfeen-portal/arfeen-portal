import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = createClient();
  const body = await req.json();

  const payload = {
    product_type: body.product_type || 'transport',
    product_id: body.product_id || null,
    from_city_id: body.from_city_id || null,
    to_city_id: body.to_city_id || null,
    valid_from: body.valid_from,
    valid_to: body.valid_to || null,
    base_price: body.base_price,
    weekend_multiplier: body.weekend_multiplier ?? 1,
    peak_multiplier: body.peak_multiplier ?? 1,
    min_pax: body.min_pax ?? 1,
    max_pax: body.max_pax || null,
    agent_markup_percent: body.agent_markup_percent ?? 0,
    notes: body.notes || null,
  };

  let data, error;

  if (body.id) {
    ({ data, error } = await supabase
      .from('rate_rules')
      .update(payload)
      .eq('id', body.id)
      .select()
      .single());
  } else {
    ({ data, error } = await supabase
      .from('rate_rules')
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
