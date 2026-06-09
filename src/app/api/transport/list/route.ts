export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export async function GET(req: NextRequest) {
  try {
    const supabase = supabaseAdminSafe;

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin client not available" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : 50;

    let query = supabase
      .from("transport_bookings")
      .select(
        `
        id,
        created_at,
        updated_at,
        customer_name,
        customer_phone,
        agent_id,
        agent_name,
        agent_code,
        pickup_city,
        dropoff_city,
        pickup_location,
        dropoff_location,
        pickup_time,
        passengers,
        vehicle_type,
        notes,
        distance_km,
        base_fare,
        agent_commission,
        total_price,
        status,
        driver_id,
        vehicle_id,
        transport_drivers:transport_bookings_driver_id_fkey (
          id,
          full_name,
          phone
        ),
        transport_vehicles:transport_bookings_vehicle_id_fkey (
          id,
          label,
          vehicle_type
        )
      `
      )
      .order("pickup_time", { ascending: false })
      .limit(limit);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("transport/list error", error);
      return NextResponse.json(
        { error: "Failed to fetch bookings", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ bookings: data ?? [] });
  } catch (err: any) {
    console.error("transport/list exception", err);
    return NextResponse.json(
      { error: "Server error", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}