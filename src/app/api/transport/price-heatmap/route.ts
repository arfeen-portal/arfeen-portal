import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('transport_routes')
    .select(
      `
      id,
      route_key,
      from_place_id,
      to_place_id,
      price_snapshots:transport_price_snapshots!inner (
        vehicle_type,
        price,
        captured_at
      )
    `
    )
    .order('captured_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ routes: data });
}
