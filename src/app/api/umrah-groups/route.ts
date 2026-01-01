import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = getSupabaseServerClient();

  // build-time safety
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: "Supabase not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();

    const { data: group, error } = await supabase
      .from("umrah_groups")
      .insert([
        {
          tenant_id: body.tenant_id,
          title: body.title,
          group_code: body.group_code,
          city_from: body.city_from,
          city_to: body.city_to,
          departure_date: body.departure_date,
          return_date: body.return_date,
          nights_makkah: body.nights_makkah,
          nights_madinah: body.nights_madinah,
          hotel_makkah: body.hotel_makkah,
          hotel_madinah: body.hotel_madinah,
          airline: body.airline,
          flight_details: body.flight_details,
          visa_type: body.visa_type,
          transport_type: body.transport_type,
          total_seats: body.total_seats,
          price_quad: body.price_quad,
          price_triple: body.price_triple,
          price_double: body.price_double,
          price_single: body.price_single,
          status: "active",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Umrah group insert error:", error);
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, group },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Umrah group error:", err);
    return NextResponse.json(
      { success: false, message: "Unexpected server error" },
      { status: 500 }
    );
  }
}
