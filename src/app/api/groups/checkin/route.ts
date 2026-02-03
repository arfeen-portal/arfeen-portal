import { NextResponse } from "next/server";
import { supabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const supabase = supabaseAdminSafe;
  {
    return NextResponse.json({ error: "Supabase not available" }, { status: 500 });
  }

  const { group_id, spot_id, member_id, lat, lng } = await req.json();

  const { data, error } = await supabase.from("group_checkins").insert({
    group_id,
    spot_id,
    member_id,
    lat,
    lng,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data });
}
