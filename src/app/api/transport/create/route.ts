import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type BookingPayload = {
  customer_name: string;
  customer_phone: string;
  agent_name: string | null;
  agent_code: string | null;
  pickup_city: string;
  dropoff_city: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  passengers: number;
  vehicle_type: string;
  notes: string | null;
  distance_km: number | null;
  base_fare: number | null;
  agent_commission: number | null;
  total_price: number | null;
  status: string;
};

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SECRET_KEY;

  if (!url || !serviceRole) {
    console.error("Missing Supabase env vars for transport create route");
    return null;
  }

  return createClient(url, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function toStringOrEmpty(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toNullableString(value: unknown): string | null {
  const str = toStringOrEmpty(value);
  return str === "" ? null : str;
}

function toNumberOrNull(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

function toIntOrDefault(value: unknown, defaultValue = 1): number {
  if (value === "" || value === null || value === undefined) return defaultValue;
  const num = parseInt(String(value), 10);
  return Number.isNaN(num) ? defaultValue : num;
}

function toIsoDateTime(value: unknown): string | null {
  if (!value) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

function normalizeStatus(value: unknown): string {
  const status = toStringOrEmpty(value).toLowerCase();
  return status || "pending";
}

function buildPayload(body: any): BookingPayload | null {
  const customer_name = toStringOrEmpty(body.customer_name);
  const customer_phone = toStringOrEmpty(body.customer_phone);
  const pickup_city = toStringOrEmpty(body.pickup_city);
  const dropoff_city = toStringOrEmpty(body.dropoff_city);
  const pickup_location = toStringOrEmpty(body.pickup_location);
  const dropoff_location = toStringOrEmpty(body.dropoff_location);
  const pickup_time = toIsoDateTime(body.pickup_time);
  const vehicle_type = toStringOrEmpty(body.vehicle_type);

  if (
    !customer_name ||
    !customer_phone ||
    !pickup_city ||
    !dropoff_city ||
    !pickup_location ||
    !dropoff_location ||
    !pickup_time ||
    !vehicle_type
  ) {
    return null;
  }

  return {
    customer_name,
    customer_phone,
    agent_name: toNullableString(body.agent_name),
    agent_code: toNullableString(body.agent_code),
    pickup_city,
    dropoff_city,
    pickup_location,
    dropoff_location,
    pickup_time,
    passengers: toIntOrDefault(body.passengers, 1),
    vehicle_type,
    notes: toNullableString(body.notes),
    distance_km: toNumberOrNull(body.distance_km),
    base_fare: toNumberOrNull(body.base_fare),
    agent_commission: toNumberOrNull(body.agent_commission),
    total_price: toNumberOrNull(body.total_price),
    status: normalizeStatus(body.status),
  };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase server client is not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const payload = buildPayload(body);

    if (!payload) {
      return NextResponse.json(
        {
          error:
            "Missing or invalid required fields: customer_name, customer_phone, pickup_city, dropoff_city, pickup_location, dropoff_location, pickup_time, vehicle_type",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("transport_bookings")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Create booking error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to create booking" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Booking created successfully",
        booking: data,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Unexpected create booking route error:", error);

    return NextResponse.json(
      {
        error: error?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}