import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = "force-dynamic";

async function getAgentId(req: Request, supabase: any) {
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) return null;

  const { data, error } = await supabase
    .from('agent_api_keys')
    .select('agent_id, is_active')
    .eq('api_key', apiKey)
    .maybeSingle();

  if (error || !data || !data.is_active) return null;
  return data.agent_id;
}

export async function POST(req: Request) {
  const supabase = createClient();
  const agentId = await getAgentId(req, supabase);

  if (!agentId) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  const body = await req.json();
  const { vehicle_id, from_city_id, to_city_id, travel_date, pax } = body;

  const { data, error } = await supabase.rpc('get_transport_rate', {
    p_vehicle: vehicle_id,
    p_from: from_city_id,
    p_to: to_city_id,
    p_date: travel_date,
    p_pax: pax,
    p_agent: agentId,
  });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Rate calc failed' }, { status: 500 });
  }

  return NextResponse.json({ price: data ?? 0 });
}
