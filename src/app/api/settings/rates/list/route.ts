import { NextResponse } from 'next/server';
import { supabaseAdminSafe } from "@/lib/supabaseAdminSafe";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = supabaseAdminSafe;

  const { data, error } = await supabase
    .from('rate_rules')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}
