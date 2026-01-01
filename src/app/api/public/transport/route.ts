import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const apiKey = searchParams.get("api_key");
  const pickup = searchParams.get("pickup");
  const dropoff = searchParams.get("dropoff");

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing api_key" },
      { status: 401 }
    );
  }

  const supabase = await createClient();

  // validate API key
  const { data: keyRow, error: keyError } = await supabase
    .from("api_keys")
    .select("id, agent_id, is_active")
    .eq("key", apiKey)
    .single();

  if (keyError || !keyRow || !keyRow.is_active) {
    return NextResponse.json(
      { error: "Invalid or inactive API key" },
      { status: 401 }
    );
  }

  // simple example: filter available vehicles/routes
  const query = supabase
    .from("transport_routes")
    .select("id, pickup_city, dropoff_city, base_price, vehicle_type")
    .limit(50);

  if (pickup) query.eq("pickup_city", pickup);
  if (dropoff) query.eq("dropoff_city", dropoff);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    agent_id: keyRow.agent_id,
    results: data,
  });
}
