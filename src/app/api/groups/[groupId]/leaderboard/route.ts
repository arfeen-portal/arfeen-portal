// app/api/groups/[groupId]/leaderboard/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const POINTS: Record<string, number> = {
  salah_haram: 10,
  salah_hotel: 3,
  umrah: 40,
  tawaf: 15,
  rawdah_visit: 25,
  ziyarat_visit: 20,
};

export async function GET(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  const supabase = await createClient();

  const { data: pilgrims, error: pilgrimsError } = await supabase
    .from("pilgrim_profiles")
    .select("id, full_name")
    .eq("group_trip_id", params.groupId);

  if (pilgrimsError || !pilgrims) {
    console.error(pilgrimsError);
    return NextResponse.json({ error: "Failed to load pilgrims" }, { status: 500 });
  }

  const { data: events, error: eventsError } = await supabase
    .from("pilgrim_spiritual_events")
    .select("pilgrim_id, event_type, occurred_at");

  if (eventsError || !events) {
    console.error(eventsError);
    return NextResponse.json({ error: "Failed to load events" }, { status: 500 });
  }

  const scores: Record<string, number> = {};

  for (const ev of events) {
    const pts = POINTS[ev.event_type] ?? 0;
    scores[ev.pilgrim_id] = (scores[ev.pilgrim_id] || 0) + pts;
  }

  const leaderboard = pilgrims
    .map((p) => ({
      pilgrim_id: p.id,
      full_name: p.full_name,
      score: scores[p.id] || 0,
    }))
    .sort((a, b) => b.score - a.score);

  return NextResponse.json({ leaderboard });
}
