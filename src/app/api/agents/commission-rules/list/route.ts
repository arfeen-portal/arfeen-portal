import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get('agent_id');

  const query = supabase
    .from('agent_commission_rules')
    .select('*')
    .order('valid_from', { ascending: false });

  if (agentId) query.eq('agent_id', agentId);

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}
