import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabase = supabaseAdmin;

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not initialized" },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing id" },
        { status: 400 }
      );
    }

    const { data: voucher, error } = await supabase
      .from("vouchers")
      .select(`
        id,
        voucher_code,
        qr_hash,
        status,
        issued_at,
        booking_id
      `)
      .eq("id", id)
      .maybeSingle();

    if (error || !voucher) {
      console.error(error);
      return NextResponse.json(
        { error: "Voucher not found" },
        { status: 404 }
      );
    }

    const { data: latest } = await supabase
      .from("driver_locations")
      .select("lat, lng, created_at")
      .eq("booking_id", voucher.booking_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      voucher,
      latest_ping: latest ?? null,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}