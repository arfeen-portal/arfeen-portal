import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { callAI } from '../../../../utils/ai';
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();

  const {
    visaProfileId,
    targetCountry,
    purpose,
    summaryData, // optional: {income,bank_balance,travel_history_count,...}
  } = body;

  const prompt = `
You are a travel visa expert. Estimate visa approval probability for:
target_country = ${targetCountry}
purpose = ${purpose}
profile_summary = ${JSON.stringify(summaryData || {})}

Return a JSON: 
{ "probability": number (0-100), "processing_time_days": number, "strengths":[string], "weaknesses":[string] }`;

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
    parsed = {
      probability: 60,
      processing_time_days: 10,
      strengths: ['fallback'],
      weaknesses: [],
    };
  }

  const { error } = await supabase.from('visa_predictions').insert({
    visa_profile_id: visaProfileId,
    target_country: targetCountry,
    purpose,
    predicted_success_probability: parsed.probability,
    processing_time_days_estimate: parsed.processing_time_days,
    reasons: parsed,
    model_version: 'v1-ai-basic',
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(parsed);
}
