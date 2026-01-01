import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const country = searchParams.get('country');
  const now = new Date().toISOString();

  let query = supabase
    .from('risk_alerts')
    .select(
      'id, title, message, category, severity, valid_from, valid_to, country_code, place_id'
    )
    .or('valid_to.is.null,valid_to.gte.' + now)
    .lte('valid_from', now)
    .order('severity', { ascending: false });

  if (country) {
    query = query.eq('country_code', country);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ alerts: data });
}
