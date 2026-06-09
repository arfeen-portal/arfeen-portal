import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";
import { requireRole } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type BookingPayload = {
  tenant_id: string | null;
  customer_name: string;
  customer_phone: string;
  agent_id: string | null;
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

function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json(
    {
      ok: false,
      success: false,
      error: message,
      ...(extra || {}),
    },
    { status }
  );
}

function jsonOk(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(
    {
      ok: true,
      success: true,
      ...data,
    },
    { status }
  );
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

function buildPayload(body: any, tenantId: string | null): BookingPayload | null {
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
    tenant_id: tenantId,
    customer_name,
    customer_phone,
    agent_id: toNullableString(body.agent_id),
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
    const authUser = await requireRole([
      "super_admin",
      "admin",
      "operations",
      "agent",
    ]);

    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return jsonError("Supabase admin client is not configured.", 500);
    }

    const tenantId = authUser.tenantId;

    if (!tenantId && authUser.role !== "super_admin") {
      return jsonError("Tenant not assigned to this user.", 403);
    }

    const body = await req.json().catch(() => ({}));
    const payload = buildPayload(body, tenantId);

    if (!payload) {
      return jsonError(
        "Missing or invalid required fields: customer_name, customer_phone, pickup_city, dropoff_city, pickup_location, dropoff_location, pickup_time, vehicle_type",
        400
      );
    }

    const { data, error } = await supabase
      .from("transport_bookings")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      return jsonError("Failed to create booking.", 500, {
        details: error.message,
      });
    }

    return jsonOk(
      {
        message: "Booking created successfully.",
        booking: data,
        tenant_id: tenantId,
        role: authUser.role,
        scope: tenantId ? "tenant" : "global_admin",
      },
      201
    );
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Unauthorized.",
      401
    );
  }
}