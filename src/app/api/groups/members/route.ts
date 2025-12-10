import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const group_id = searchParams.get("group_id");

  if (!group_id) {
    return NextResponse.json({ error: "Missing group_id" }, { status: 400 });
  }

  const supabase = createClient();

  // Members
  const { data: members, error: membersErr } = await supabase
    .from("group_members")
    .select("id, full_name, passport, seat_no, role, qr_token")
    .eq("group_id", group_id)
    .order("full_name", { ascending: true });

  if (membersErr) {
    return NextResponse.json({ error: membersErr.message }, { status: 500 });
  }

  // Current spot: simple - first by order_no
  const { data: spots, error: spotsErr } = await supabase
    .from("ziyarat_spots")
    .select("id")
    .order("order_no", { ascending: true });

  if (spotsErr) {
    return NextResponse.json({ error: spotsErr.message }, { status: 500 });
  }

  const currentSpotId = spots && spots.length > 0 ? spots[0].id : null;

  // Checkins for current spot
  let presentMemberIds = new Set<string>();

  if (currentSpotId) {
    const { data: checkins } = await supabase
      .from("group_checkins")
      .select("member_id")
      .eq("group_id", group_id)
      .eq("spot_id", currentSpotId);

    (checkins || []).forEach((c) => {
      if (c.member_id) presentMemberIds.add(c.member_id);
    });
  }

  const enriched =
    members?.map((m) => ({
      id: m.id,
      full_name: m.full_name,
      passport: m.passport,
      seat_no: m.seat_no,
      role: m.role,
      qr_token: m.qr_token,
      is_present: presentMemberIds.has(m.id),
    })) || [];

  return NextResponse.json({
    members: enriched,
    currentSpotId,
  });
}
