// src/app/api/locator/ingest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  const body = await req.json();

  const {
    profile_id,
    lat,
    lng,
    accuracy,
    heading,
    speed,
    timestamp,
  } = body;

  if (
    !profile_id ||
    typeof lat !== "number" ||
    typeof lng !== "number"
  ) {
    return NextResponse.json(
      { error: "profile_id, lat, lng required" },
      { status: 400 }
    );
  }

  const now =
    typeof timestamp === "string"
      ? timestamp
      : new Date().toISOString();

  // live table (last position)
  const { error: liveError } = await supabase
    .from("locator_live")
    .upsert(
      {
        profile_id,
        lat,
        lng,
        accuracy,
        heading,
        speed,
        updated_at: now,
      },
      { onConflict: "profile_id" } // ensure unique index on profile_id
    );

  if (liveError) {
    console.error("live upsert error", liveError);
  }

  // history table (full track)
  const { error: historyError } = await supabase
    .from("locator_history")
    .insert({
      profile_id,
      lat,
      lng,
      accuracy,
      heading,
      speed,
      timestamp: now,
    });

  if (historyError) {
    console.error("history insert error", historyError);
    return NextResponse.json(
      { error: historyError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
