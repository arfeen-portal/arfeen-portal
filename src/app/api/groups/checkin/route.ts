import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const { group_id, spot_id, member_id, lat, lng } = await req.json();

  const { data, error } = await supabase.from('group_checkins').insert({
    group_id, spot_id, member_id, lat, lng
  });

  if (error) return NextResponse.json({ error }, { status: 400 });

  return NextResponse.json({ success: true, data });
}
