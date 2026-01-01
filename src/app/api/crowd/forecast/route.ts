export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const city = (searchParams.get('city') || 'Makkah') as
      | 'Makkah'
      | 'Madinah';

    const dateParam = searchParams.get('date');
    const today = new Date();
    const date = dateParam
      ? dateParam
      : today.toISOString().slice(0, 10);

    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from('crowd_forecast')
      .select('*')
      .eq('city', city)
      .eq('date', date)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    let forecast = data;

    if (!forecast) {
      const d = new Date(date);
      const month = d.getMonth() + 1;
      const day = d.getDay();

      let baseLevel = 5;

      if (day === 5) baseLevel += 2;
      if ([8, 9, 10, 11].includes(month)) baseLevel += 2;

      const expected_crowd_level = Math.min(10, baseLevel);

      const peak_hours =
        city === 'Makkah'
          ? ['04:00-06:00', '18:00-21:00']
          : ['03:30-05:30', '19:00-22:00'];

      forecast = {
        city,
        date,
        expected_crowd_level,
        peak_hours,
        notes: 'Auto heuristic based on weekday + month',
      };
    }

    return NextResponse.json({ success: true, forecast });
  } catch (error: any) {
    console.error('crowd forecast error', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
