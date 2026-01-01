import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const { data: voucher, error } = await supabase
    .from('vouchers')
    .select(`
      id,
      voucher_code,
      qr_hash,
      status,
      issued_at,
      booking_id
    `)
    .eq('id', id)
    .maybeSingle();

  if (error || !voucher) {
    console.error(error);
    return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
  }

  // latest driver ping for this booking (optional)
  const { data: latest } = await supabase
    .from('driver_locations')
    .select('lat, lng, created_at')
    .eq('booking_id', voucher.booking_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    voucher,
    latest_ping: latest ?? null,
  });
}
