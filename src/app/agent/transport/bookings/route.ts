import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const supabase = supabaseAdmin;
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not initialized" }, { status: 500 });
  }

  const url = new URL(req.url);
  const agentId = url.searchParams.get("agentId");

  let query = supabase
    .from("transport_bookings")
    .select("*");

  if (agentId) {
    query = query.eq("agent_id", agentId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to load bookings", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ bookings: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = supabaseAdmin;
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not initialized" }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // (Optional) ensure insert is array to avoid TS/typing issues
  const payload = Array.isArray(body) ? body : [body];

  const { error } = await supabase
    .from("transport_bookings")
    .insert(payload);

  if (error) {
    return NextResponse.json(
      { error: "Failed to create booking", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}