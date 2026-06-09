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

    if (!group_id || !spot_id || !member_id) {
      return NextResponse.json(
        { error: "group_id, spot_id and member_id are required" },
        { status: 400 }
      );
    }

    const { data: existing, error: existingError } = await supabase
      .from("group_checkins")
      .select("id")
      .eq("group_id", group_id)
      .eq("spot_id", spot_id)
      .eq("member_id", member_id)
      .maybeSingle();

    if (existingError !== null) {
      const message =
        typeof existingError === "object" && "message" in existingError
          ? String(existingError.message)
          : "Failed to check existing check-in";

      return NextResponse.json({ error: message }, { status: 500 });
    }

    if (!existing) {
      const { error: insertError } = await supabase
        .from("group_checkins")
        .insert({
          group_id,
          spot_id,
          member_id,
          status: "visited",
        });

      if (insertError !== null) {
        const message =
          typeof insertError === "object" && "message" in insertError
            ? String(insertError.message)
            : "Failed to create check-in";

        return NextResponse.json({ error: message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}