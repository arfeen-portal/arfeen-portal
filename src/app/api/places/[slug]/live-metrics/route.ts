import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
export async function GET(req: NextRequest, context: any) {
  const { params } = context;
  const { slug } = params;
  // 🔴 pehle: const supabase = createClient();
  const supabase = await createClient(); // ✅

  // 1) Place find karo
  const { data: place, error: placeErr } = await supabase
    .from('places')
    .select('id, name_default, country_code, city')
    .eq('slug', params.slug)
    .maybeSingle();

  if (placeErr || !place) {
    return NextResponse.json(
      { error: 'Place not found' },
      { status: 404 }
    );
  }

  const metricTypes = ['crowd_level', 'waiting_minutes', 'ac_intensity'];

  const { data: metrics, error: metricsErr } = await supabase
    .from('place_metrics')
    .select('metric_type, metric_value, measured_at, meta')
    .eq('place_id', place.id)
    .in('metric_type', metricTypes)
    .order('measured_at', { ascending: false });

  if (metricsErr) {
    return NextResponse.json(
      { error: metricsErr.message },
      { status: 400 }
    );
  }

  const latest: Record<string, any> = {};
  for (const m of metrics ?? []) {
    if (!latest[m.metric_type]) latest[m.metric_type] = m;
  }

  return NextResponse.json({
    place,
    metrics: latest,
  });
}
