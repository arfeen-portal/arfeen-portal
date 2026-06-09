import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not available" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const group_id = body.group_id;
    const spot_id = body.spot_id;
    const member_id = body.member_id;
    const lat = body.lat ?? null;
    const lng = body.lng ?? null;

    if (!group_id || !spot_id || !member_id) {
      return NextResponse.json(
        { error: "group_id, spot_id and member_id are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("group_checkins")
      .insert({
        group_id,
        spot_id,
        member_id,
        lat,
        lng,
      })
      .select("*")
      .maybeSingle();

    if (error) {
      const message =
        typeof error === "object" && error !== null && "message" in error
          ? String(error.message)
          : "Failed to create check-in";

      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}