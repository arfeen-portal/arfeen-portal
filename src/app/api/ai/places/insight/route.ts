import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { callAI } from '../../../../../utils/ai';

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();

  const { placeId, insightType, baseData } = body; 
  // insightType: 'climate_happiness' | 'tourist_trap' | 'comfort_score' | 'food_safety'

  const { data: place, error: pErr } = await supabase
    .from('places')
    .select('id, name_default, country_code, city')
    .eq('id', placeId)
    .maybeSingle();

  if (pErr || !place) {
    return NextResponse.json({ error: 'Place not found' }, { status: 400 });
  }

  const prompt = `
You are a travel data AI.
We want to compute "${insightType}" for this place:

${JSON.stringify(place)}
Extra data: ${JSON.stringify(baseData || {})}

Return JSON with at least:
{ "score": number (0-100), "label": string, "notes": [string] }`;

  let text: string;
  try {
    text = await callAI(prompt);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'AI error' },
      { status: 500 }
    );
  }

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { score: 70, label: 'Good', notes: ['fallback'] };
  }

  const { error } = await supabase.from('ai_place_insights').insert({
    place_id: place.id,
    insight_type: insightType,
    payload: parsed,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(parsed);
}
