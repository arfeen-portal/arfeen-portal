import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 60;

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type LocatorPayload = {
  domain: string;
  profile_id: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: string;
};

const rateLimit = new Map<string, RateLimitEntry>();

function normalizeDomain(value: string | null) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .split(",")[0]
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/:\d+$/, "")
    .replace(/\/.*$/, "");
}

function getRequestDomain(req: NextRequest) {
  return (
    normalizeDomain(req.headers.get("x-forwarded-host")) ||
    normalizeDomain(req.headers.get("x-vercel-forwarded-host")) ||
    normalizeDomain(req.headers.get("host"))
  );
}

function getRequestIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(profileId: string, ip: string) {
  const now = Date.now();
  const key = `${profileId}:${ip}`;
  const current = rateLimit.get(key);

  if (!current || current.resetAt <= now) {
    rateLimit.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  current.count += 1;
  return true;
}

function parseOptionalNumber(
  value: unknown,
  field: string,
  min: number,
  max: number
) {
  if (value === undefined || value === null) return { ok: true as const, value: null };

  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: `Invalid ${field}` }, { status: 400 }),
    };
  }

  return { ok: true as const, value };
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) return false;

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function createSignature(payload: {
  domain: string;
  profile_id: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: string;
}) {
  const secret = process.env.LOCATOR_INGEST_SECRET;

  const message = [
    payload.domain,
    payload.profile_id,
    payload.lat,
    payload.lng,
    payload.accuracy ?? "",
    payload.heading ?? "",
    payload.speed ?? "",
    payload.timestamp,
  ].join("|");

  return crypto.createHmac("sha256", secret as string).update(message).digest("hex");
}

function validatePayload(body: any, domain: string) {
  const {
    profile_id,
    lat,
    lng,
    accuracy,
    heading,
    speed,
    timestamp,
  } = body;

  if (!domain) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Domain is required" }, { status: 400 }),
    };
  }

  if (
    typeof profile_id !== "string" ||
    !/^[A-Za-z0-9._:-]{1,128}$/.test(profile_id)
  ) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Invalid profile_id" }, { status: 400 }),
    };
  }

  if (
    typeof lat !== "number" ||
    !Number.isFinite(lat) ||
    lat < -90 ||
    lat > 90 ||
    typeof lng !== "number" ||
    !Number.isFinite(lng) ||
    lng < -180 ||
    lng > 180
  ) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Invalid coordinates" }, { status: 400 }),
    };
  }

  if (typeof timestamp !== "string") {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Invalid timestamp" }, { status: 400 }),
    };
  }

  const requestTime = new Date(timestamp).getTime();

  if (!Number.isFinite(requestTime)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Invalid timestamp" }, { status: 400 }),
    };
  }

  if (Math.abs(Date.now() - requestTime) > MAX_CLOCK_SKEW_MS) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Expired or future timestamp" }, { status: 401 }),
    };
  }

  const parsedAccuracy = parseOptionalNumber(accuracy, "accuracy", 0, 10000);
  if (!parsedAccuracy.ok) return parsedAccuracy;

  const parsedHeading = parseOptionalNumber(heading, "heading", 0, 360);
  if (!parsedHeading.ok) return parsedHeading;

  const parsedSpeed = parseOptionalNumber(speed, "speed", 0, 500);
  if (!parsedSpeed.ok) return parsedSpeed;

  return {
    ok: true as const,
    payload: {
      domain,
      profile_id,
      lat,
      lng,
      accuracy: parsedAccuracy.value,
      heading: parsedHeading.value,
      speed: parsedSpeed.value,
      timestamp,
    } satisfies LocatorPayload,
  };
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.LOCATOR_INGEST_SECRET) {
      console.error("LOCATOR_INGEST_SECRET is not configured");
      return NextResponse.json(
        { error: "Locator ingest is not configured" },
        { status: 500 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const domain = normalizeDomain(body?.domain) || getRequestDomain(req);
    const validation = validatePayload(body, domain);
    if (!validation.ok) return validation.response;

    const signature = req.headers.get("x-locator-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing locator signature" },
        { status: 401 }
      );
    }

    const expectedSignature = createSignature(validation.payload);

    if (!safeEqual(signature, expectedSignature)) {
      return NextResponse.json(
        { error: "Invalid locator signature" },
        { status: 401 }
      );
    }

    const ip = getRequestIp(req);
    if (!checkRateLimit(validation.payload.profile_id, ip)) {
      return NextResponse.json(
        { error: "Too many locator requests" },
        { status: 429 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data: domainRow, error: domainError } = await supabase
      .from("portal_domains")
      .select("tenant_id")
      .eq("domain", domain)
      .maybeSingle();

    if (domainError) {
      console.error("locator domain resolve error", domainError);
      return NextResponse.json(
        { error: "Tenant lookup failed" },
        { status: 500 }
      );
    }

    if (!domainRow?.tenant_id) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 403 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("locator_profiles")
      .select("id, tenant_id, is_active")
      .eq("id", validation.payload.profile_id)
      .maybeSingle();

    if (profileError) {
      console.error("locator profile lookup error", profileError);
      return NextResponse.json(
        { error: "Profile lookup failed" },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Locator profile not found" },
        { status: 404 }
      );
    }

    if (profile.tenant_id !== domainRow.tenant_id) {
      return NextResponse.json(
        { error: "Locator profile tenant mismatch" },
        { status: 403 }
      );
    }

    if (profile.is_active !== true) {
      return NextResponse.json(
        { error: "Locator profile is inactive" },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();

    const { error: liveError } = await supabase.from("live_locations").upsert(
      {
        profile_id: validation.payload.profile_id,
        lat: validation.payload.lat,
        lng: validation.payload.lng,
        accuracy: validation.payload.accuracy,
        heading: validation.payload.heading,
        speed: validation.payload.speed,
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
        profile_id: validation.payload.profile_id,
        lat: validation.payload.lat,
        lng: validation.payload.lng,
        accuracy: validation.payload.accuracy,
        heading: validation.payload.heading,
        speed: validation.payload.speed,
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