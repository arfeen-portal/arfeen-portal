import { NextResponse } from 'next/server';
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('training_modules')
    .select('id, slug, title, description, level, tags')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ modules: data });
}
