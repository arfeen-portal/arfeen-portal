import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
const supabase = createSupabaseServerClient();

export async function GET() {
 
  const { data, error } = await supabase
    .from("agents")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] });
}
