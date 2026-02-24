import { NextResponse, NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: { groupId: string } }
) {
  const { groupId } = context.params;

  const supabase = supabaseAdmin;
  if (!supabase) {
    return NextResponse.json(
      { error: "SERVICE_UNAVAILABLE" },
      { status: 503 }
    );
  }

  const { data: pilgrims } = await supabase
    .from("pilgrim_profiles")
    .select("id, full_name")
    .eq("group_trip_id", groupId);

  const { data: sites } = await supabase
    .from("ziyaraat_sites")
    .select("*")
    .eq("is_active", true);

  const { data: checkins } = await supabase
    .from("ziyaraat_checkins")
    .select("*");

  return NextResponse.json({
    pilgrims: pilgrims ?? [],
    sites: sites ?? [],
    checkins: checkins ?? [],
  });
}
