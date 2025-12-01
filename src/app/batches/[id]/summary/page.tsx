import { createClient } from '@/utils/supabase/server';

interface PageProps {
  params: { id: string };
}

export default async function BatchSummaryPage({ params }: PageProps) {
  const supabase = await createClient(); // <-- IMPORTANT: await

  const batchId = params.id;

  const { data: summary, error } = await supabase
    .from('batch_profit_summary_v')
    .select('*')
    .eq('batch_id', batchId)
    .maybeSingle();

  const { data: bookings } = await supabase
    .from('transport_bookings')
    .select('*')
    .eq('batch_id', batchId)
    .order('pickup_datetime', { ascending: true });

  // baqi code same rehne do
}
