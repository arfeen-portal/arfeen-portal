import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      customer_name,
      customer_phone,
      agent_id,
      agent_name,
      agent_code,
      pickup_city,
      pickup_location,
      dropoff_city,
      dropoff_location,
      pickup_time,
      passengers,
      vehicle_type,
      notes,
      distance_km,
      base_fare,
      agent_commission,
      total_price,
    } = body;

    const supabase = createClient();

    const { data, error } = await supabase
      .from("transport_bookings")
      .insert([
        {
          customer_name,
          customer_phone,
          agent_id,
          agent_name,
          agent_code,
          pickup_city,
          pickup_location,
          dropoff_city,
          dropoff_location,
          pickup_time,
          passengers,
          vehicle_type,
          notes,
          distance_km,
          base_fare,
          agent_commission,
          total_price,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("transport/create error", error);
      return NextResponse.json(
        { error: "Failed to create booking", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ booking: data }, { status: 201 });
  } catch (err: any) {
    console.error("transport/create exception", err);
    return NextResponse.json(
      { error: "Server error", details: err.message ?? String(err) },
      { status: 500 }
    );
  }
}
