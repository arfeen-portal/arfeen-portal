import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";

const supabaseAdmin = createAdminClient();

export async function POST(request: Request) {
  try {
    const { tripId, memberId } = await request.json();

    if (!tripId || !memberId) {
      return NextResponse.json(
        { error: "tripId and memberId are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("family_trip_members")
      .insert({
        trip_id: tripId,
        member_id: memberId,
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ tripMember: data }, { status: 201 });
  } catch (err: any) {
    console.error("trip/join error", err);
    return NextResponse.json(
      { error: err.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}
