export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdminSafe } from "@/lib/supabaseAdminSafe";

const ALLOWED_STATUSES = [
  "pending",
  "confirmed",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
];

export async function POST(req: NextRequest) {
  try {
    const supabase = supabaseAdminSafe;

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin client not available" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const id = body?.booking_id;
    const status = body?.status;

    if (!id || !status) {
      return NextResponse.json(
        { error: "booking_id and status are required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("transport_bookings")
      .update([{ status, updated_at: new Date().toISOString() }])
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("transport/update-status error", error);
      return NextResponse.json(
        { error: "Failed to update booking status", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, booking: data });
  } catch (err: any) {
    console.error("transport/update-status exception", err);
    return NextResponse.json(
      { error: "Server error", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}