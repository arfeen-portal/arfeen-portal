import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json(
      { error: "SERVICE_UNAVAILABLE" },
      { status: 503 }
    );
  }

  const { data, error } = await supabase
    .from("vouchers")
    .select(
      "id, voucher_code, qr_hash, status, issued_at, booking_id"
    )
    .order("issued_at", { ascending: false });

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch vouchers" },
      { status: 500 }
    );
  }

  return NextResponse.json({ items: data ?? [] });
}
