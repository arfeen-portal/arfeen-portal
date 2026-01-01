import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
export const dynamic = "force-dynamic";
export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('places')
    .select('id, name_default, city, country_code')
    .in('country_code', ['SA', 'IQ', 'IR'])
    .eq('place_type', 'shrine')
    .order('country_code', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ shrines: data });
}
