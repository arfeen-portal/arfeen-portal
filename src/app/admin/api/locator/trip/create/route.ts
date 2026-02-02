import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";


export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();

  // ✅ build-time safety
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase server client not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();

    const { data, error } = await supabase
      .from("locator_trips")
      .insert([body]) // ❗ array form is MUST
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload" },
      { status: 400 }
    );
  }
}
