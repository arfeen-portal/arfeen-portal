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

export async function GET(req: Request) {
  const supabase = createClient();
  const agentId = await getAgentId(req, supabase);

  if (!agentId) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('routes')
    .select('id, name, from_city_id, to_city_id');

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }

  return NextResponse.json({ routes: data ?? [] });
}
