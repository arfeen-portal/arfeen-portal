import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, context: any) {
  const { params } = context;
  const { groupId } = params;
  const supabase = await createClient();

  const { data: pilgrims } = await supabase
    .from("pilgrim_profiles")
    .select("id, full_name")
    .eq("group_trip_id", params.groupId);

  const { data: sites } = await supabase
    .from("ziyarat_sites")
    .select("*")
    .eq("is_active", true);

  const { data: checkins } = await supabase
    .from("ziyarat_checkins")
    .select("*");

  return NextResponse.json({
    pilgrims: pilgrims ?? [],
    sites: sites ?? [],
    checkins: checkins ?? [],
  });
}
