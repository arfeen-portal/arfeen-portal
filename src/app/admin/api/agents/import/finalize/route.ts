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

  const { data: rows, error: rowsError } = await supabaseAdmin
    .from('agent_import_staging')
    .select(
      'id, raw_name, raw_email, raw_phone, raw_city, raw_country, matched_agent_id'
    )
    .eq('batch_id', batchId)
    .not('status', 'eq', 'imported');

  if (rowsError) {
    console.error(rowsError);
    return NextResponse.json({ error: 'Failed to load staging rows' }, { status: 500 });
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({ imported: 0, updated: 0 });
  }

  const newAgents: any[] = [];
  const updatedAgents: any[] = [];

  for (const row of rows) {
    if (row.matched_agent_id) {
      updatedAgents.push({
        id: row.matched_agent_id,
        phone: row.raw_phone,
        city: row.raw_city,
        country: row.raw_country,
      });
    } else {
      newAgents.push({
        name: row.raw_name,
        email: row.raw_email,
        phone: row.raw_phone,
        city: row.raw_city,
        country: row.raw_country,
        import_batch_id: batchId,
        status: 'active',
        is_active: true,
      });
    }
  }

  let insertedCount = 0;
  let updatedCount = 0;

  if (newAgents.length > 0) {
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('agents')
      .insert(newAgents)
      .select('id');

    if (insertError) {
      console.error(insertError);
      return NextResponse.json({ error: 'Failed to insert agents' }, { status: 500 });
    }

    insertedCount = inserted?.length ?? 0;
  }

  if (updatedAgents.length > 0) {
    const { error: updateError } = await supabaseAdmin
      .from('agents')
      .upsert(updatedAgents, { onConflict: 'id' });

    if (updateError) {
      console.error(updateError);
      return NextResponse.json({ error: 'Failed to update matched agents' }, { status: 500 });
    }

    updatedCount = updatedAgents.length;
  }

  await supabaseAdmin
    .from('agent_import_staging')
    .update({ status: 'imported' })
    .eq('batch_id', batchId);

  await supabaseAdmin
    .from('agent_import_batches')
    .update({
      status: 'completed',
      imported_rows: insertedCount + updatedCount,
    })
    .eq('id', batchId);

  await supabaseAdmin.from('agent_import_audit_log').insert({
    tenant_id: null,
    user_id: null,
    batch_id: batchId,
    action: 'finalize',
    meta: { inserted: insertedCount, updated: updatedCount },
  });

  return NextResponse.json({
    inserted: insertedCount,
    updated: updatedCount,
  });
}
