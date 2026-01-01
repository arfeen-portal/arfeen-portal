import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdminSafe();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Supabase env not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();

    // ✅ expected inputs (adjust to your actual UI)
    const familyId = body?.family_id || body?.familyId;
    const memberId = body?.member_id || body?.memberId;
    const memberName = body?.member_name || body?.name || null;

    if (!familyId || !memberId) {
      return NextResponse.json(
        { error: "family_id and member_id required" },
        { status: 400 }
      );
    }

    // ✅ join table name: adjust if your schema differs
    const joinRow = {
      family_id: familyId,
      member_id: memberId,
      member_name: memberName,
      joined_at: new Date().toISOString(),
      status: "active",
    };

    const { data, error } = await (supabaseAdmin as any)
      .from("family_members")
      .insert([joinRow])
      .select("*")
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to join family" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, member: data });
  } catch (e: any) {
    console.error("family join route error:", e);
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
