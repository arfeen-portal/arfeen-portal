import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('places')
    .select('id, name_default, place_type, region, city')
    .eq('country_code', 'PK')
    .order('region', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ places: data });
}
