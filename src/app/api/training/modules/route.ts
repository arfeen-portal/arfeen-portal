import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('training_modules')
    .select('id, slug, title, description, level, tags')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ modules: data });
}
