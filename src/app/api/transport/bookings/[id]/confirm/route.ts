import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: { id: string } };

export async function POST(_req: Request, { params }: Params) {
  const supabase = createClient();
  const id = params.id;

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
