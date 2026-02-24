import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

async function getAgentId(req: Request, supabase: any) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey) return null;

  const { data, error } = await supabase
    .from("agent_api_keys")
    .select("agent_id, is_active")
    .eq("api_key", apiKey)
    .maybeSingle();

  if (error || !data || !data.is_active) return null;

  return data.agent_id;
}

export async function GET(req: Request) {
  const supabase = supabaseAdmin;

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not initialized" },
      { status: 500 }
    );
  }

  const agentId = await getAgentId(req, supabase);

  if (!agentId) {
    return NextResponse.json(
      { error: "Invalid API key" },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from("routes")
    .select("id, name, from_city_id, to_city_id")
    .limit(100);

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch routes" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    routes: data ?? [],
  });
}