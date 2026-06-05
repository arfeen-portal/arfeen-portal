import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin not configured" },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from("umrah_packages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load packages" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const payload = {
      package_name: body.package_name,
      package_code: body.package_code,
      package_type: body.package_type || "group",
      status: body.status || "draft",

      departure_date: body.departure_date || null,
      arrival_date: body.arrival_date || null,
      total_days: Number(body.total_days || 0),
      makkah_nights: Number(body.makkah_nights || 0),
      madinah_nights: Number(body.madinah_nights || 0),
      total_seats: Number(body.total_seats || 0),

      airline_name: body.airline_name || null,
      flight_number: body.flight_number || null,

      makkah_hotel_inventory_id: body.makkah_hotel_inventory_id || null,
      madinah_hotel_inventory_id: body.madinah_hotel_inventory_id || null,
      visa_inventory_id: body.visa_inventory_id || null,
      transport_plan_id: body.transport_plan_id || null,

      sharing_price: Number(body.sharing_price || 0),
      quad_price: Number(body.quad_price || 0),
      triple_price: Number(body.triple_price || 0),
      double_price: Number(body.double_price || 0),

      notes: body.notes || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("umrah_packages")
      .insert([payload])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Package save failed" },
      { status: 500 }
    );
  }
}