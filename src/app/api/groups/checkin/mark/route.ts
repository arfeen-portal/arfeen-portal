import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not available" }, { status: 500 });
  }

  const body = await req.json();
  const { group_id, member_id, spot_id } = body;

  if (!group_id || !member_id || !spot_id) {
    return NextResponse.json(
      { error: "group_id, member_id and spot_id are required" },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("group_checkins")
    .select("id")
    .eq("group_id", group_id)
    .eq("spot_id", spot_id)
    .eq("member_id", member_id)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from("group_checkins").insert({
      group_id,
      spot_id,
      member_id,
      status: "visited",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
