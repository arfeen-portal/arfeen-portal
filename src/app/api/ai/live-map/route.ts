import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const fallbackSummary = {
  total_entities: 4,
  active_entities: 4,
  live_now: 4,
  drivers: 1,
  groups: 1,
};

const fallbackLocations = [
  {
    id: "demo-live-1",
    entity_id: "family-group-1",
    entity_type: "passenger",
    entity_name: "VIP Family Group",
    phone: "+966500000000",
    vehicle_type: "GMC",
    trip_code: "JED-MAK-001",
    latitude: 21.4225,
    longitude: 39.8262,
    speed_kmh: 35,
    heading: 120,
    battery_percent: 88,
    status: "in_transit",
    last_seen_at: new Date().toISOString(),
    meta: { city: "Makkah" },
  },
  {
    id: "demo-live-2",
    entity_id: "driver-1",
    entity_type: "driver",
    entity_name: "Driver Ahmed",
    phone: "+966511111111",
    vehicle_type: "Hiace",
    trip_code: "JED-AIR-002",
    latitude: 21.5433,
    longitude: 39.1728,
    speed_kmh: 50,
    heading: 80,
    battery_percent: 75,
    status: "active",
    last_seen_at: new Date().toISOString(),
    meta: { city: "Jeddah" },
  },
];

const fallbackGeofences = [
  {
    id: "geo-1",
    name: "Makkah Hotel Zone",
    city: "Makkah",
    type: "hotel_zone",
    status: "active",
  },
  {
    id: "geo-2",
    name: "Jeddah Airport Zone",
    city: "Jeddah",
    type: "airport_zone",
    status: "active",
  },
];

export async function GET() {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json({
        summary: fallbackSummary,
        locations: fallbackLocations,
        geofences: fallbackGeofences,
        error: "Supabase admin client not configured",
      });
    }

    const [{ data: summary }, { data: locations }, { data: geofences }] =
      await Promise.all([
        supabase.from("v_live_map_summary").select("*").single(),
        supabase
          .from("live_map_locations")
          .select("*")
          .order("last_seen_at", { ascending: false }),
        supabase
          .from("live_map_geofences")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

    return NextResponse.json({
      summary: summary ?? fallbackSummary,
      locations: Array.isArray(locations) ? locations : fallbackLocations,
      geofences: Array.isArray(geofences) ? geofences : fallbackGeofences,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        summary: fallbackSummary,
        locations: fallbackLocations,
        geofences: fallbackGeofences,
        error: error?.message ?? "Live map failed",
      },
      { status: 200 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin client not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const { data, error } = await supabase
      .from("live_map_locations")
      .upsert(
        [
          {
            entity_id: body.entity_id ?? crypto.randomUUID(),
            entity_type: body.entity_type ?? "driver",
            entity_name: body.entity_name ?? "Unnamed Driver",
            phone: body.phone ?? null,
            vehicle_type: body.vehicle_type ?? null,
            trip_code: body.trip_code ?? null,
            latitude: Number(body.latitude),
            longitude: Number(body.longitude),
            speed_kmh: Number(body.speed_kmh || 0),
            heading: Number(body.heading || 0),
            battery_percent: body.battery_percent
              ? Number(body.battery_percent)
              : null,
            status: body.status ?? "active",
            last_seen_at: new Date().toISOString(),
            meta: body.meta ?? {},
          },
        ],
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ location: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "Location update failed" },
      { status: 500 }
    );
  }
}