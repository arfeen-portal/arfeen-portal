import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const apiKey = url.searchParams.get("api_key");

  const supabase = createClient();

  const { data: keyRow } = await supabase
    .from("api_keys")
    .select("id, agent_id, is_active")
    .eq("key_value", apiKey)
    .eq("is_active", true)
    .single();

  if (!keyRow) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("vehicles")
    .select("id, name, capacity, base_price")
    .eq("is_active", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
