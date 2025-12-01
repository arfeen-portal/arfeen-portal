import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createClient();

    const {
      id,
      service_type,
      name,
      vehicle_type,
      min_distance_km,
      max_distance_km,
      base_per_km,
      base_flat,
      use_flat,
      agent_commission_percent,
      profit_percent,
      priority,
      active,

      // HOTEL fields
      hotel_city,
      hotel_star,
      room_type,
      min_nights,
      max_nights,

      // FLIGHT fields
      flight_from,
      flight_to,
      cabin_class,
      airline_code,
    } = body;

    const payload: any = {
      service_type: service_type || "transport",
      name,
      vehicle_type: vehicle_type || null,
      min_distance_km:
        min_distance_km === "" || min_distance_km == null
          ? null
          : Number(min_distance_km),
      max_distance_km:
        max_distance_km === "" || max_distance_km == null
          ? null
          : Number(max_distance_km),
      base_per_km:
        base_per_km === "" || base_per_km == null
          ? null
          : Number(base_per_km),
      base_flat:
        base_flat === "" || base_flat == null ? null : Number(base_flat),
      use_flat: Boolean(use_flat),
      agent_commission_percent:
        agent_commission_percent === "" || agent_commission_percent == null
          ? 0
          : Number(agent_commission_percent),
      profit_percent:
        profit_percent === "" || profit_percent == null
          ? 0
          : Number(profit_percent),
      priority:
        priority === "" || priority == null ? 100 : Number(priority),
      active: active !== false,
      updated_at: new Date().toISOString(),

      // HOTEL fields
      hotel_city: hotel_city || null,
      hotel_star: hotel_star || null,
      room_type: room_type || null,
      min_nights:
        min_nights === "" || min_nights == null
          ? null
          : Number(min_nights),
      max_nights:
        max_nights === "" || max_nights == null
          ? null
          : Number(max_nights),

      // FLIGHT fields
      flight_from: flight_from || null,
      flight_to: flight_to || null,
      cabin_class: cabin_class || null,
      airline_code: airline_code || null,
    };

    let result;
    if (id) {
      result = await supabase
        .from("rate_rules")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("rate_rules")
        .insert([{ ...payload }])
        .select()
        .single();
    }

    const { data, error } = result;

    if (error) {
      console.error("rate_rules/save error", error);
      return NextResponse.json(
        { error: "Failed to save rule", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ rule: data });
  } catch (err: any) {
    console.error("rate_rules/save exception", err);
    return NextResponse.json(
      { error: "Server error", details: err.message ?? String(err) },
      { status: 500 }
    );
  }
}
