import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();

  const { userId, journeyId, activityKey, placeId, quantity, meta } = body;

  const { data: activity, error: aErr } = await supabase
    .from('spiritual_activities')
    .select('id')
    .eq('key', activityKey)
    .maybeSingle();

  if (aErr || !activity) {
    return NextResponse.json(
      { error: 'Activity not found' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('spiritual_logs')
    .insert({
      user_id: userId,
      journey_id: journeyId,
      activity_id: activity.id,
      place_id: placeId || null,
      quantity: quantity || 1,
      meta: meta || {},
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ log: data });
}
