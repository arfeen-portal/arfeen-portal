import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin client not configured" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("transport_vehicles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ vehicles: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin client not configured" }, { status: 500 });
  }

  const body = await req.json();

  const payload = {
    name: body.name,
    vehicle_class: body.vehicle_class,
    plate_number: body.plate_number || null,
    capacity: Number(body.capacity || 0),
    image_url: body.image_url || null,
    notes: body.notes || null,
    status: body.status || "active",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("transport_vehicles")
    .insert([payload])
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ vehicle: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin client not configured" }, { status: 500 });
  }

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "Vehicle ID required" }, { status: 400 });

  const payload = {
    name: body.name,
    vehicle_class: body.vehicle_class,
    plate_number: body.plate_number || null,
    capacity: Number(body.capacity || 0),
    image_url: body.image_url || null,
    notes: body.notes || null,
    status: body.status || "active",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("transport_vehicles")
    .update(payload)
    .eq("id", body.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ vehicle: data });
}