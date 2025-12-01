import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function getAgentFromApiKey(req: Request, supabase: any) {
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

  // 🔴 Yahan fix:
  const agentId = await getAgentFromApiKey(req, supabase);

  if (!agentId) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  const body = await req.json();

  const { data, error } = await supabase
    .from('transport_bookings')
    .insert([
      {
        agent_id: agentId,
        ...body,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Booking create failed' }, { status: 500 });
  }

  return NextResponse.json({ booking: data });
}
