import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
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

    return NextResponse.json(data ?? []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Unexpected active trips error." },
      { status: 500 }
    );
  }
}