import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) return false;

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function createSignature(payload: {
  profile_id: string;
  lat: number;
  lng: number;
  timestamp: string;
}) {
  const secret = process.env.LOCATOR_INGEST_SECRET;

  if (!secret) {
    throw new Error("LOCATOR_INGEST_SECRET is not configured");
  }

  const message = [
    payload.profile_id,
    payload.lat,
    payload.lng,
    payload.timestamp,
  ].join("|");

  return crypto.createHmac("sha256", secret).update(message).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
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
      typeof lng !== "number" ||
      typeof timestamp !== "string"
    ) {
      return NextResponse.json(
        { error: "profile_id, lat, lng, timestamp required" },
        { status: 400 }
      );
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: "Invalid coordinates" },
        { status: 400 }
      );
    }

    const requestTime = new Date(timestamp).getTime();

    if (!Number.isFinite(requestTime)) {
      return NextResponse.json(
        { error: "Invalid timestamp" },
        { status: 400 }
      );
    }

    const nowMs = Date.now();

    if (Math.abs(nowMs - requestTime) > MAX_CLOCK_SKEW_MS) {
      return NextResponse.json(
        { error: "Expired or future timestamp" },
        { status: 401 }
      );
    }

    const signature = req.headers.get("x-locator-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing locator signature" },
        { status: 401 }
      );
    }

    const expectedSignature = createSignature({
      profile_id,
      lat,
      lng,
      timestamp,
    });

    if (!safeEqual(signature, expectedSignature)) {
      return NextResponse.json(
        { error: "Invalid locator signature" },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { error: liveError } = await supabase.from("locator_live").upsert(
      {
        profile_id,
        lat,
        lng,
        accuracy: typeof accuracy === "number" ? accuracy : null,
        heading: typeof heading === "number" ? heading : null,
        speed: typeof speed === "number" ? speed : null,
        updated_at: now,
      },
      { onConflict: "profile_id" }
    );

    if (liveError) {
      console.error("locator live upsert error", liveError);
      return NextResponse.json(
        { error: "Live location update failed" },
        { status: 500 }
      );
    }

    const { error: historyError } = await supabase
      .from("locator_history")
      .insert({
        profile_id,
        lat,
        lng,
        accuracy: typeof accuracy === "number" ? accuracy : null,
        heading: typeof heading === "number" ? heading : null,
        speed: typeof speed === "number" ? speed : null,
        timestamp: now,
      });

    if (historyError) {
      console.error("locator history insert error", historyError);
      return NextResponse.json(
        { error: "Location history insert failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("locator ingest error", err);
    return NextResponse.json(
      { error: "Invalid locator request" },
      { status: 400 }
    );
  }
}