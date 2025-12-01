// app/api/groups/[groupId]/certificates/generate/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  const supabase = await createClient();
  const groupId = params.groupId;

  // 1) Get stats for all pilgrims in this group
  const { data: stats, error: statsError } = await supabase
    .from("pilgrim_spiritual_stats")
    .select("*")
    .eq("group_trip_id", groupId);

  if (statsError) {
    console.error(statsError);
    return NextResponse.json(
      { error: "Failed to load pilgrim stats" },
      { status: 500 }
    );
  }

  if (!stats || stats.length === 0) {
    return NextResponse.json(
      { error: "No pilgrims or stats found for this group" },
      { status: 400 }
    );
  }

  // 2) Build payload for insert
  const payload = stats.map((row) => ({
    pilgrim_id: row.pilgrim_id,
    group_trip_id: row.group_trip_id,
    certificate_type: "umrah_journey",
    stats_snapshot: {
      full_name: row.full_name,
      group_trip_id: row.group_trip_id,
      salah_haram_count: row.salah_haram_count,
      salah_hotel_count: row.salah_hotel_count,
      umrah_count: row.umrah_count,
      tawaf_count: row.tawaf_count,
      rawdah_visit_count: row.rawdah_visit_count,
      ziyarat_visit_count: row.ziyarat_visit_count,
      generated_at: new Date().toISOString(),
    },
    // pdf_url / image_url baad me set kar sakte hain
  }));

  const { data: inserted, error: insertError } = await supabase
    .from("pilgrim_certificates")
    .upsert(payload, {
      onConflict: "pilgrim_id,group_trip_id,certificate_type",
    })
    .select("*");

  if (insertError) {
    console.error(insertError);
    return NextResponse.json(
      { error: "Failed to generate certificates" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: "Certificates generated/updated",
    count: inserted?.length || 0,
    certificates: inserted ?? [],
  });
}
