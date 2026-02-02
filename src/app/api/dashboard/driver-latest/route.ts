// src/app/api/dashboard/driver-latest/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from "@/lib/supabaseServer";
const supabase = createSupabaseServerClient();

export const dynamic = "force-dynamic";

export async function GET() {
  

  const { data, error } = await supabase
    .from('mv_driver_latest_location')
    .select(`
      driver_id,
      booking_id,
      lat,
      lng,
      speed,
      heading,
      accuracy,
      last_ping_at,
      drivers:driver_id (
        full_name,
        phone
      ),
      transport_bookings:booking_id (
        booking_code,
        from_city_name,
        to_city_name,
        status
      )
    `)
    .order('last_ping_at', { ascending: false });

  if (error) {
    console.error('driver-latest API error', error);
    return NextResponse.json({ error: 'Failed to fetch driver locations' }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}
