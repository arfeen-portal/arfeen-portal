import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = getSupabaseAdminSafe();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const { data: booking, error } = await supabase
    .from("umrah_package_bookings")
    .insert([body])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: consumeError } = await supabase.rpc("consume_umrah_package_inventory", {
    p_package_id: body.package_id,
    p_passengers: body.passengers || 1,
  });

  if (consumeError) {
    return NextResponse.json({ error: consumeError.message }, { status: 500 });
  }

  return NextResponse.json({ booking });
}