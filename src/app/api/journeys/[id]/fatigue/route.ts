import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
export const dynamic = "force-dynamic";

// ⬆️ imports same hi rahenge

export async function POST(req: NextRequest, context: any) {
  const { params } = context;
  const { id } = params;

  // ⬇️ YAHAN SE NEECHAY AAPKA PURANA CODE BILKUL AS-IS:
  const supabase = await createClient();
  const body = await req.json();
  // baaki jo bhi tumne likha hai, sab jaisa hai waisa rehne do


  const { userId, steps, temperature, sleepHours, hydrationLiters, subjectiveFatigue } =
    body;

  const { data: log, error } = await supabase
    .from('fatigue_logs')
    .insert({
      user_id: userId,
      journey_id: params.id,
      steps,
      temperature,
      sleep_hours: sleepHours,
      hydration_liters: hydrationLiters,
      subjective_fatigue: subjectiveFatigue,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // yahan simple example score (baad me yahan AI call aa jayega)
  const score =
    (subjectiveFatigue ?? 0) * 5 +
    (temperature ?? 0) * 0.5 -
    (sleepHours ?? 0) * 2 -
    (hydrationLiters ?? 0) * 1;

  const level =
    score < 20 ? 'low' : score < 40 ? 'medium' : score < 60 ? 'high' : 'extreme';

  const { error: sErr } = await supabase
    .from('ai_fatigue_scores')
    .insert({
      journey_id: params.id,
      user_id: userId,
      score,
      level,
      reasons: { simple: true },
    });

  if (sErr) {
    return NextResponse.json({ error: sErr.message }, { status: 400 });
  }

  return NextResponse.json({ log, score, level });
}
