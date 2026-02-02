import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  try {
    const { booking_id, status } = await req.json();
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("transport_bookings")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking_id)
      .select()
      .single();

    if (error) {
      console.error("update-status error", error);
      return NextResponse.json(
        { error: "Failed to update status", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ booking: data });
  } catch (err: any) {
    console.error("update-status exception", err);
    return NextResponse.json(
      { error: "Server error", details: err.message ?? String(err) },
      { status: 500 }
    );
  }
}
