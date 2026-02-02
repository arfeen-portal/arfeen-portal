import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
const supabase = createSupabaseServerClient();


export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  // ✅ Build-time safe Supabase client


  // ✅ VERY IMPORTANT GUARD
  if (!supabase) {
    // Build ke waqt yahan se quietly exit
    return NextResponse.json([], { status: 200 });
  }

  const { data, error } = await supabase
    .from("v_active_trips")
    .select("*");

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
