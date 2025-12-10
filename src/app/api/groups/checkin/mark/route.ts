import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const body = await req.json();

  const { group_id, member_id, spot_id } = body;

  if (!group_id || !member_id || !spot_id) {
    return NextResponse.json(
      { error: "group_id, member_id and spot_id are required" },
      { status: 400 }
    );
  }

  // Already present?
  const { data: existing } = await supabase
    .from("group_checkins")
    .select("id")
    .eq("group_id", group_id)
    .eq("spot_id", spot_id)
    .eq("member_id", member_id)
    .maybeSingle();

  if (!existing) {
    const { error: insertErr } = await supabase.from("group_checkins").insert({
      group_id,
      spot_id,
      member_id,
      status: "visited",
    });

    if (insertErr) {
      return NextResponse.json(
        { error: insertErr.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: true });
}
