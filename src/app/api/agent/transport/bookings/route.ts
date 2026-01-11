// src/app/api/agent/transport/bookings/route.ts
// @ts-nocheck

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET  /api/agent/transport/bookings?agentId=...
 * Simple list of bookings per agent
 */
export async function GET(req: Request) {
  const supabase = await createClient();
  const url = new URL(req.url);
  const agentId = url.searchParams.get("agentId");

  let query = supabase.from("transport_bookings").select("*");

  if (agentId) {
    query = query.eq("agent_id", agentId);
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    console.error("GET bookings error:", error);
    return NextResponse.json(
      { error: "Failed to load bookings" },
      { status: 500 }
    );
  }

  return NextResponse.json({ bookings: data ?? [] });
}

/**
 * POST /api/agent/transport/bookings
 * Body: JSON with booking fields
 */
export async function POST(req: Request) {
  const supabase = await createClient();

  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("transport_bookings").insert(body);

  if (error) {
    console.error("Create booking error:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
