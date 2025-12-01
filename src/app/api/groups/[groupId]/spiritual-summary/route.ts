// app/api/groups/[groupId]/spiritual-summary/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  const supabase = await createClient();

  const { data: groupRow, error: groupError } = await supabase
    .from("group_spiritual_summary")
    .select("*")
    .eq("group_trip_id", params.groupId)
    .single();

  if (groupError) {
    console.error(groupError);
    return NextResponse.json({ error: "Failed to load summary" }, { status: 500 });
  }

  const { data: pilgrims } = await supabase
    .from("pilgrim_profiles")
    .select("id, full_name, is_group_leader")
    .eq("group_trip_id", params.groupId);

  const { data: events } = await supabase
    .from("pilgrim_spiritual_events")
    .select("pilgrim_id, event_type, occurred_at");

  return NextResponse.json({
    group: groupRow,
    pilgrims: pilgrims ?? [],
    events: events ?? [],
  });
}
