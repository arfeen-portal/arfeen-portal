import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { callAI } from '../../../../utils/ai';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();

  const { journeyId, userId } = body;

  const { data: logs, error } = await supabase
    .from('spiritual_logs')
    .select(
      `
      quantity,
      logged_at,
      activity:spiritual_activities!inner ( key, label )
    `
    )
    .eq('journey_id', journeyId)
    .eq('user_id', userId)
    .order('logged_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const prompt = `
You are a spiritual journey coach for Umrah/Ziyarat.

Here are the activities for one traveller:

${JSON.stringify(logs || [])}

Return JSON:
{
  "score": number (0-100),
  "level": "light" | "balanced" | "strong" | "intense",
  "summary": string,
  "recommendations": [string]
}
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
    parsed = {
      score: 70,
      level: 'balanced',
      summary: 'fallback',
      recommendations: [],
    };
  }

  return NextResponse.json(parsed);
}
