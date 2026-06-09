import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not available", items: [] },
        { status: 500 }
      );
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("driver_rides")
      .select("*")
      .gte("pickup_time", start.toISOString())
      .lte("pickup_time", end.toISOString())
      .order("pickup_time", { ascending: true });

    if (error) {
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? String(error.message)
          : "Failed to load today rides";

      return NextResponse.json({ error: message, items: [] }, { status: 500 });
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";

    return NextResponse.json({ error: message, items: [] }, { status: 500 });
  }
}