import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { callAI } from '../../../../utils/ai';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();

  const { routeId, vehicleType } = body;

  const { data: route, error: rErr } = await supabase
    .from('transport_routes')
    .select('id, route_key, distance_km')
    .eq('id', routeId)
    .maybeSingle();

  if (rErr || !route) {
    return NextResponse.json({ error: 'Route not found' }, { status: 400 });
  }

  const { data: history } = await supabase
    .from('transport_price_snapshots')
    .select('price, captured_at')
    .eq('route_id', route.id)
    .eq('vehicle_type', vehicleType)
    .order('captured_at', { ascending: false })
    .limit(20);

  const prompt = `
You are a pricing AI for transport routes.

Route: ${route.route_key}
Distance: ${route.distance_km} km
Vehicle: ${vehicleType}
Recent prices:
${JSON.stringify(history || [])}

Return JSON:
{ "recommended_price": number, "low": number, "high": number, "comment": string }
`;

  let text: string;
  try {
    text = await callAI(prompt);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'AI error' }, { status: 500 });
  }

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = {
      recommended_price: 200,
      low: 180,
      high: 230,
      comment: 'fallback',
    };
  }

  const { error } = await supabase.from('ai_transport_price_predictions').insert({
    route_id: route.id,
    vehicle_type: vehicleType,
    predicted_price: parsed.recommended_price,
    currency: 'SAR',
    model_version: 'v1-basic',
    meta: parsed,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(parsed);
}
