import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = createClient();
  const body = await req.json();

  const { id, parent_agent_id, level, default_commission, is_active } = body;

  if (!id) {
    return NextResponse.json({ error: 'Missing agent id' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('agents')
    .update({
      parent_agent_id: parent_agent_id || null,
      level: level ?? 1,
      default_commission: default_commission ?? 0,
      is_active: is_active ?? true,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ agent: data });
}
