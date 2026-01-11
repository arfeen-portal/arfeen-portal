import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const supabase = createClient();
  const body = await req.json();

  const { qr_token, group_id, spot_id, lat, lng } = body;

  if (!qr_token || !group_id || !spot_id) {
    return NextResponse.json(
      { error: "Missing qr_token, group_id or spot_id" },
      { status: 400 }
    );
  }

  // Find member by qr_token
  const { data: member, error: memberErr } = await supabase
    .from("group_members")
    .select("id, group_id")
    .eq("qr_token", qr_token)
    .single();

  if (memberErr || !member) {
    return NextResponse.json({ error: "Invalid QR code" }, { status: 404 });
  }

  if (member.group_id !== group_id) {
    return NextResponse.json(
      { error: "QR does not belong to this group" },
      { status: 400 }
    );
  }

  // Insert checkin (if not already done for this spot)
  const { data: existing } = await supabase
    .from("group_checkins")
    .select("id")
    .eq("group_id", group_id)
    .eq("spot_id", spot_id)
    .eq("member_id", member.id)
    .maybeSingle();

  if (!existing) {
    await supabase.from("group_checkins").insert({
      group_id,
      spot_id,
      member_id: member.id,
      lat,
      lng,
      status: "visited",
    });
  }

  return NextResponse.json({ success: true });
}
