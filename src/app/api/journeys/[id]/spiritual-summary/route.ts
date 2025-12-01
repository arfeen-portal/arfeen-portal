import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const journeyId = params.id;

  // 🔴 pehle: const supabase = createClient();
  const supabase = await createClient(); // ✅

  const { data, error } = await supabase.rpc(
    'spiritual_summary_for_journey',
    {
      p_journey_id: journeyId,
    }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ summary: data });
}
