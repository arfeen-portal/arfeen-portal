import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";

export const revalidate = 0;

export async function GET() {
   const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("live_locations")
    .select("*")
    .order("last_seen_at", { ascending: false });

  if (error) {
    console.error("live_locations error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}
