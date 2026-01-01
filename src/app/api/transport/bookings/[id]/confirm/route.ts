import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, context: any) {
  const { params } = context;
  const { id } = params;
  const supabase = createClient();

  const { error: updateError } = await supabase
    .from("transport_bookings")
    .update({ status: "confirmed" })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  const { error: rpcError } = await supabase.rpc(
    "create_transport_booking_journal",
    { p_booking_id: id }
  );

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
