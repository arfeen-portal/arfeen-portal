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

    // expected: location_id OR (family_id + member_id) plus coords fields
    const locationId = body?.id || body?.location_id || body?.locationId;

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };

    // allow common fields
    if (typeof body?.lat === "number") updatePayload.lat = body.lat;
    if (typeof body?.lng === "number") updatePayload.lng = body.lng;
    if (typeof body?.accuracy === "number") updatePayload.accuracy = body.accuracy;
    if (body?.status) updatePayload.status = body.status;
    if (body?.meta) updatePayload.meta = body.meta;

    // if your schema uses pickup_lat/pickup_lng etc, adjust accordingly

    if (!locationId) {
      // fallback update by family_id + member_id (if you use those)
      const familyId = body?.family_id || body?.familyId;
      const memberId = body?.member_id || body?.memberId;

      if (!familyId || !memberId) {
        return NextResponse.json(
          { error: "location id (or family_id + member_id) required" },
          { status: 400 }
        );
      }

      const { data, error } = await (supabaseAdmin as any)
        .from("family_locations")
        .update(updatePayload)
        .eq("family_id", familyId)
        .eq("member_id", memberId)
        .select("*")
        .single();

      if (error) {
        console.error(error);
        return NextResponse.json(
          { error: "Failed to update location" },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true, location: data });
    }

    const { data, error } = await (supabaseAdmin as any)
      .from("family_locations")
      .update(updatePayload)
      .eq("id", locationId)
      .select("*")
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to update location" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, location: data });
  } catch (e: any) {
    console.error("location update route error:", e);
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
