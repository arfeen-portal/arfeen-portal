import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = supabaseAdmin;
  if (!supabase) {
    return NextResponse.json(
      { error: "SERVICE_UNAVAILABLE" },
      { status: 503 }
    );
  }

  const body = await req.json();

  const voucher_code = "V-" + Date.now();
  const qr_hash = randomUUID();

  const { data, error } = await supabase
    .from("vouchers")
    .insert({
      booking_id: body.booking_id,
      voucher_code,
      qr_hash,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Voucher create failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ voucher: data });
}
