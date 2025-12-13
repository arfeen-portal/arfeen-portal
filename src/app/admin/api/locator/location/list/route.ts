import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdminSafe();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Supabase env not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const familyId = searchParams.get("family_id") || searchParams.get("familyId");
    const memberId = searchParams.get("member_id") || searchParams.get("memberId");
    const limit = Number(searchParams.get("limit") || "50");

    // ✅ Basic filters (adjust to your schema)
    let q = (supabaseAdmin as any)
      .from("family_locations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(Number.isFinite(limit) ? Math.min(limit, 500) : 50);

    if (familyId) q = q.eq("family_id", familyId);
    if (memberId) q = q.eq("member_id", memberId);

    const { data, error } = await q;

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to load locations" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, locations: data ?? [] });
  } catch (e: any) {
    console.error("location list route error:", e);
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
