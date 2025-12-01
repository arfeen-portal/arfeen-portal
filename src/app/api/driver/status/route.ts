import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();

  const { driverId, journeySegmentId, status, meta } = body;

  if (!driverId || !status) {
    return NextResponse.json(
      { error: 'driverId and status required' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('driver_status_events')
    .insert({
      driver_id: driverId,
      journey_segment_id: journeySegmentId || null,
      status,
      meta: meta || {},
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ event: data });
}
