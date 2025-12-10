import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";

const supabaseAdmin = createAdminClient();


export async function POST(request: Request) {
  try {
    const { familyCode, title, startsAt, endsAt } = await request.json();

    if (!familyCode || !title) {
      return NextResponse.json(
        { error: "familyCode and title are required" },
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
      .from("family_trips")
      .insert({
        family_id: family.id,
        title,
        starts_at: startsAt ?? null,
        ends_at: endsAt ?? null,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ trip: data }, { status: 201 });
  } catch (err: any) {
    console.error("trip/create error", err);
    return NextResponse.json(
      { error: err.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}
