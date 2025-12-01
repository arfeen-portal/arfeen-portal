import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";

const supabaseAdmin = createAdminClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const familyCode = searchParams.get("familyCode");

    if (!familyCode) {
      return NextResponse.json(
        { error: "familyCode is required" },
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

    const { data: locations, error: locErr } = await supabaseAdmin
      .from("family_locations")
      .select("*")
      .eq("family_id", family.id)
      .order("created_at", { ascending: false });

    if (locErr) throw locErr;

    return NextResponse.json({ locations });
  } catch (err: any) {
    console.error("location/list error", err);
    return NextResponse.json(
      { error: err.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}

