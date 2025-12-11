// @ts-nocheck
// app/api/certificates/[certificateId]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: { certificateId: string } }
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
      pdf_url,
      image_url,
      group_trip_id,
      pilgrim_profiles ( full_name )
    `
    )
    .eq("id", params.certificateId)
    .single();

  if (error || !data) {
    console.error(error);
    return NextResponse.json(
      { error: "Certificate not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ certificate: data });
}
