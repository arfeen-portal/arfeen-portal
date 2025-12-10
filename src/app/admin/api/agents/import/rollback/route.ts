import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { batchId } = await req.json();

  if (!batchId) {
    return NextResponse.json({ error: 'batchId required' }, { status: 400 });
  }

  const { data: batch, error: batchError } = await supabaseAdmin
    .from('agent_import_batches')
    .select('id, status')
    .eq('id', batchId)
    .single();

  if (batchError || !batch) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  }

  if (batch.status === 'rolled_back') {
    return NextResponse.json({ message: 'Already rolled back' });
  }

  const { data: deletedAgents, error: deleteError } = await supabaseAdmin
    .from('agents')
    .delete()
    .eq('import_batch_id', batchId)
    .select('id');

  if (deleteError) {
    console.error(deleteError);
    return NextResponse.json({ error: 'Failed to rollback agents' }, { status: 500 });
  }

  const deletedCount = deletedAgents?.length ?? 0;

  await supabaseAdmin
    .from('agent_import_staging')
    .update({ status: 'rolled_back' })
    .eq('batch_id', batchId);

  await supabaseAdmin
    .from('agent_import_batches')
    .update({
      status: 'rolled_back',
      rolled_back_at: new Date().toISOString(),
      rolled_back_by: null,
    })
    .eq('id', batchId);

  await supabaseAdmin.from('agent_import_audit_log').insert({
    tenant_id: null,
    user_id: null,
    batch_id: batchId,
    action: 'rollback',
    meta: { deleted_agents: deletedCount },
  });

  return NextResponse.json({
    message: 'Rollback completed',
    deleted_agents: deletedCount,
  });
}
