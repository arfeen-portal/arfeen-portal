import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = (searchParams.get('city') || 'Makkah') as 'Makkah' | 'Madinah';
    const dateParam = searchParams.get('date'); // YYYY-MM-DD

    const today = new Date();
    const date =
      dateParam ??
      today.toISOString().slice(0, 10); // default: today

    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from('crowd_forecast')
      .select('*')
      .eq('city', city)
      .eq('date', date)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows
      throw error;
    }

    // If no row, generate heuristic forecast
    let forecast = data;
    if (!forecast) {
      const dt = new Date(date);
      const month = dt.getMonth() + 1;
      const day = dt.getDay(); // 0=Sun, 5=Fri

      let baseLevel = 5;

      // Friday bump
      if (day === 5) baseLevel += 2;

      // Ramadan / Hajj-ish months (rough)
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
        notes: 'Auto heuristic based on weekday + month'
      } as any;
    }

    return NextResponse.json({ success: true, forecast });
  } catch (error: any) {
    console.error('Crowd forecast error', error);
    return NextResponse.json(
      { success: false, error: error.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
