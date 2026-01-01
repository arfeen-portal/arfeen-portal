import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get('agentId');

  if (!agentId) {
    return NextResponse.json({ error: 'agentId required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('agent_wallet_ledger')
    .select('entry_type, amount')
    .eq('agent_id', agentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  let balance = 0;
  for (const row of data || []) {
    balance += row.entry_type === 'credit' ? Number(row.amount) : -Number(row.amount);
  }

  return NextResponse.json({ balance, entries: data });
}
