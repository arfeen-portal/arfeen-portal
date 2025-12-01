import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: { id: string } };

export async function POST(req: Request, { params }: Params) {
  const supabase = createClient();
  const body = await req.json();
  const status = body.status as "upcoming" | "ongoing" | "completed";

  const { data, error } = await supabase
    .from("driver_rides")
    .update({ status })
    .eq("id", params.id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ item: data });
}
