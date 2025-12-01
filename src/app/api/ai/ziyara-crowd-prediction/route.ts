import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { callAI } from '../../../../utils/ai';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();

  const { placeId } = body;

  const { data: place, error: pErr } = await supabase
    .from('places')
    .select('id, name_default, country_code, city')
    .eq('id', placeId)
    .maybeSingle();

  if (pErr || !place) {
    return NextResponse.json({ error: 'Place not found' }, { status: 400 });
  }

  // recent crowd metrics
  const { data: metrics } = await supabase
    .from('place_metrics')
    .select('metric_value, measured_at')
    .eq('place_id', place.id)
    .eq('metric_type', 'crowd_level')
    .order('measured_at', { ascending: false })
    .limit(20);

  const prompt = `
You are an AI that predicts shrine/ziyarah crowd levels.
Given last crowd samples (0-100) with timestamps:
${JSON.stringify(metrics || [])}

Place: ${place.name_default} (${place.country_code}, ${place.city || ''})

Return JSON:
{ "next_1h": number, "next_3h": number, "next_6h": number, "comment": string }
`;

  let text: string;
  try {
    text = await callAI(prompt);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'AI error' }, { status: 500 });
  }

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { next_1h: 70, next_3h: 60, next_6h: 50, comment: 'fallback' };
  }

  return NextResponse.json(parsed);
}
