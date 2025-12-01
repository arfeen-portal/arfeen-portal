import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const {
      tripId,
      familyMemberId,
      lat,
      lng,
      accuracy,
      battery,
    } = await request.json();

    if (!tripId || !familyMemberId || !lat || !lng) {
      return NextResponse.json(
        { error: 'tripId, familyMemberId, lat, lng required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('locations')
      .insert({
        trip_id: tripId,
        family_member_id: familyMemberId,
        lat,
        lng,
        accuracy: accuracy ?? null,
        battery: battery ?? null,
      })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ location: data });
  } catch (err: any) {
    console.error('Location update error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
