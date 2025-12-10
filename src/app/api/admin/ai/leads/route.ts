import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET(_req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from('bookings')
      .select('id, customer_name, customer_phone, created_at, source, total_price')
      .in('source', ['ai_planner', 'public_landing'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    const total = data?.length ?? 0;

    return NextResponse.json({
      success: true,
      total,
      leads: data ?? []
    });
  } catch (error: any) {
    console.error('AI leads error', error);
    return NextResponse.json(
      { success: false, error: error.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
