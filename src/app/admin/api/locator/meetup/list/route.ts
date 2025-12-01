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

    const { data, error } = await supabaseAdmin
      .from("family_meetups")
      .select("*")
      .eq("family_id", family.id)
      .order("scheduled_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ meetups: data ?? [] });
  } catch (err: any) {
    console.error("meetup/list error", err);
    return NextResponse.json(
      { error: err.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}
