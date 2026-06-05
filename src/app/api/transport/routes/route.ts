import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase admin client not configured" },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("transport_routes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ routes: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase admin client not configured" },
      { status: 500 }
    );
  }

  const body = await req.json();

  const routeName = String(body.title || body.route_name || "").trim();

  if (!routeName) {
    return NextResponse.json(
      { error: "Route name is required" },
      { status: 400 }
    );
  }

  const payload = {
    title: routeName,
    route_name: routeName,
    pickup_location: body.pickup_location || null,
    dropoff_location: body.dropoff_location || null,
    pickup_lat: body.pickup_lat || null,
    pickup_lng: body.pickup_lng || null,
    dropoff_lat: body.dropoff_lat || null,
    dropoff_lng: body.dropoff_lng || null,
    status: body.status || "active",
    notes: body.notes || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("transport_routes")
    .insert([payload])
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ route: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase admin client not configured" },
      { status: 500 }
    );
  }

  const body = await req.json();

  if (!body.id) {
    return NextResponse.json(
      { error: "Route ID required" },
      { status: 400 }
    );
  }

  const routeName = String(body.title || body.route_name || "").trim();

  if (!routeName) {
    return NextResponse.json(
      { error: "Route name is required" },
      { status: 400 }
    );
  }

  const payload = {
    title: routeName,
    route_name: routeName,
    pickup_location: body.pickup_location || null,
    dropoff_location: body.dropoff_location || null,
    pickup_lat: body.pickup_lat || null,
    pickup_lng: body.pickup_lng || null,
    dropoff_lat: body.dropoff_lat || null,
    dropoff_lng: body.dropoff_lng || null,
    status: body.status || "active",
    notes: body.notes || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("transport_routes")
    .update(payload)
    .eq("id", body.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ route: data });
}