import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const { tripId, setByMemberId, title, lat, lng, meetTime } =
      await request.json();

    if (!tripId || !title || !lat || !lng) {
      return NextResponse.json(
        { error: 'tripId, title, lat, lng required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('meetup_points')
      .insert({
        trip_id: tripId,
        set_by_member_id: setByMemberId ?? null,
        title,
        lat,
        lng,
        meet_time: meetTime ?? null,
      })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ meetup: data });
  } catch (err: any) {
    console.error('Meetup set error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
