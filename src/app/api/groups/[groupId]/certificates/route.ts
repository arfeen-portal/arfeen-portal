// app/api/groups/[groupId]/certificates/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pilgrim_certificates")
    .select(
      `
      id,
      certificate_type,
      generated_at,
      stats_snapshot,
      pilgrim_profiles ( full_name )
    `
    )
    .eq("group_trip_id", params.groupId)
    .order("generated_at", { ascending: false });

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load certificates" },
      { status: 500 }
    );
  }

  return NextResponse.json({ certificates: data ?? [] });
}
