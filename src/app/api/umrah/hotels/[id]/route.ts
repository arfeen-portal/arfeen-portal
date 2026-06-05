import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("umrah_hotel_inventory")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to load hotel" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });
    }

    const body = await req.json();

    const payload = {
      hotel_name: body.hotel_name,
      supplier_name: body.supplier_name,
      city: body.city,
      category: body.category,
      sharing_rate: Number(body.sharing_rate || 0),
      quad_rate: Number(body.quad_rate || 0),
      triple_rate: Number(body.triple_rate || 0),
      double_rate: Number(body.double_rate || 0),
      currency: body.currency || "SAR",
      start_date: body.start_date,
      end_date: body.end_date,
      meal_plan: body.meal_plan,
      distance_from_haram: body.distance_from_haram,
      notes: body.notes,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("umrah_hotel_inventory")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Hotel update failed" }, { status: 500 });
  }
}