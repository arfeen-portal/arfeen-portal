import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { callAI } from '../../../../utils/ai';

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();

  const {
    userId,
    journeyId,
    steps,
    temperature,
    sleepHours,
    hydrationLiters,
    subjectiveFatigue,
  } = body;

  // 1) simple sanity prompt for AI
  const prompt = `
You are a medical-style fatigue scoring assistant for pilgrims in hot climate.
Given:
- steps: ${steps}
- temperature: ${temperature}
- sleep_hours: ${sleepHours}
- hydration_liters: ${hydrationLiters}
- subjective_fatigue (0-10): ${subjectiveFatigue}

Return a JSON with:
{ "score": number (0-100), "level":"low|medium|high|extreme", "reasons": [string] }
`;

  let aiText: string;
  try {
    aiText = await callAI(prompt);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'AI error' },
      { status: 500 }
    );
  }

  let parsed: any;
  try {
    parsed = JSON.parse(aiText);
  } catch {
    parsed = { score: 50, level: 'medium', reasons: ['fallback'] };
  }

  const score = parsed.score ?? 50;
  const level = parsed.level ?? 'medium';

  const { error: insertErr } = await supabase
    .from('ai_fatigue_scores')
    .insert({
      journey_id: journeyId,
      user_id: userId,
      score,
      level,
      reasons: parsed,
    });

  if (insertErr) {
    return NextResponse.json(
      { error: insertErr.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ score, level, reasons: parsed.reasons });
}
