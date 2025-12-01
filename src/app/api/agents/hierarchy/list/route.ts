import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('agents')
    .select(`
      id,
      name,
      parent_agent_id,
      level,
      default_commission,
      is_active,
      parent:parent_agent_id ( id, name )
    `)
    .order('name', { ascending: true });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}
