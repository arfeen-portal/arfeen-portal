import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";

const supabaseAdmin = createAdminClient();

export async function POST(request: Request) {
  try {
    const { familyCode, memberId, latitude, longitude, note } =
      await request.json();

    if (!familyCode || !memberId || latitude == null || longitude == null) {
      return NextResponse.json(
        { error: "familyCode, memberId, latitude, longitude required" },
        { status: 400 }
      );
    }

    const { data: family, error: famErr } = await supabaseAdmin
      .from("families")
      .select("id")
      .eq("family_code", familyCode)
      .single();

    if (famErr || !family) {
      return NextResponse.json(
        { error: "Family not found" },
        { status: 404 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("family_sos")
      .insert({
        family_id: family.id,
        member_id: memberId,
        latitude,
        longitude,
        note: note ?? null,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ sos: data }, { status: 201 });
  } catch (err: any) {
    console.error("sos/create error", err);
    return NextResponse.json(
      { error: err.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}
