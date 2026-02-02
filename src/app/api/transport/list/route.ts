export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from "@/lib/supabaseServer";


export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient();

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Number(limitParam) : 50;

    let query = supabase
      .from('transport_bookings')
      .select(
        `
        *,
        transport_drivers:transport_bookings_driver_id_fkey(id, full_name, phone),
        transport_vehicles:transport_bookings_vehicle_id_fkey(id, label, vehicle_type)
      `
      )
      .order('pickup_time', { ascending: false })
      .limit(limit);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('transport/list error', error);
      return NextResponse.json(
        { error: 'Failed to fetch bookings', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ bookings: data ?? [] });
  } catch (err: any) {
    console.error('transport/list exception', err);
    return NextResponse.json(
      { error: 'Server error', details: err.message ?? String(err) },
      { status: 500 }
    );
  }
}
