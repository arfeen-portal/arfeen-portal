import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const supabase = createClient();
  const bookingId = params.id;

  const { data, error } = await supabase
    .from("tracking_locations")
    .select("lat,lng,created_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // reverse for oldest → newest
  return NextResponse.json({ data: (data || []).reverse() });
}
