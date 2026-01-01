import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { booking_id, driver_id, vehicle_id } = await req.json();
    const supabase = createClient();

    const { data, error } = await supabase
      .from("transport_bookings")
      .update({
        driver_id,
        vehicle_id,
        status: "assigned",
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking_id)
      .select()
      .single();

    if (error) {
      console.error("assign-driver error", error);
      return NextResponse.json(
        { error: "Failed to assign driver", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ booking: data });
  } catch (err: any) {
    console.error("assign-driver exception", err);
    return NextResponse.json(
      { error: "Server error", details: err.message ?? String(err) },
      { status: 500 }
    );
  }
}
