import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  const { nfc_tag_id, group_id, member_id, lat, lng } = await req.json();

  if (!nfc_tag_id || !group_id || !member_id) {
    return NextResponse.json(
      { error: "Missing nfc_tag_id, group_id or member_id" },
      { status: 400 }
    );
  }

  const { data: spot, error: spotErr } = await supabase
    .from("ziyarat_spots")
    .select("id")
    .eq("nfc_tag_id", nfc_tag_id)
    .single();

  if (spotErr || !spot) {
    return NextResponse.json({ error: "NFC tag not linked to any spot" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("group_checkins")
    .select("id")
    .eq("group_id", group_id)
    .eq("spot_id", spot.id)
    .eq("member_id", member_id)
    .maybeSingle();

  if (!existing) {
    await supabase.from("group_checkins").insert({
      group_id,
      spot_id: spot.id,
      member_id,
      lat,
      lng,
      status: "visited",
    });
  }

  return NextResponse.json({ success: true });
}
