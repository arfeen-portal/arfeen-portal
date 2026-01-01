import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = createClient();
  const body = await req.json();

  const voucher_code = "V-" + Date.now();
  const qr_hash = randomUUID();

  const { data, error } = await supabase
    .from("vouchers")
    .insert([
      {
        booking_id: body.booking_id,
        voucher_code,
        qr_hash,
        status: "pending"
      }
    ])
    .select()
    .single();

  if (error) {
    console.log(error);
    return NextResponse.json({ error: "Voucher create failed" }, { status: 500 });
  }

  return NextResponse.json({ voucher: data });
}
