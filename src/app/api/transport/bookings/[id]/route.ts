export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdminSafe } from "@/lib/supabaseAdminSafe";

function toNullableNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = supabaseAdminSafe;
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin client not available" },
        { status: 500 }
      );
    }

    const { id } = await params;

    const { data, error } = await supabase
      .from("transport_bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Booking not found", details: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json({ booking: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = supabaseAdminSafe;
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin client not available" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const updatePayload = {
      customer_name: body.customer_name?.trim() || null,
      customer_phone: body.customer_phone?.trim() || null,
      agent_id: body.agent_id || null,
      agent_name: body.agent_name?.trim() || null,
      agent_code: body.agent_code?.trim() || null,
      pickup_city: body.pickup_city?.trim() || null,
      dropoff_city: body.dropoff_city?.trim() || null,
      pickup_location: body.pickup_location?.trim() || null,
      dropoff_location: body.dropoff_location?.trim() || null,
      pickup_time: body.pickup_time || null,
      passengers: body.passengers ? Number(body.passengers) : 1,
      vehicle_type: body.vehicle_type?.trim() || null,
      notes: body.notes?.trim() || null,
      distance_km: toNullableNumber(body.distance_km),
      base_fare: toNullableNumber(body.base_fare),
      agent_commission: toNullableNumber(body.agent_commission),
      total_price: toNullableNumber(body.total_price),
      status: body.status?.trim() || "pending",
      driver_id: body.driver_id || null,
      vehicle_id: body.vehicle_id || null,
      updated_by: body.updated_by || null,
      pickup_lat: toNullableNumber(body.pickup_lat),
      pickup_lng: toNullableNumber(body.pickup_lng),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("transport_bookings")
      .update([updatePayload])
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update booking", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, booking: data });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = supabaseAdminSafe;
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin client not available" },
        { status: 500 }
      );
    }

    const { id } = await params;

    const { error } = await supabase
      .from("transport_bookings")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete booking", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}