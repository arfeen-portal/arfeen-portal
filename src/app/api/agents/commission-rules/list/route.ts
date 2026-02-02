export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
const supabase = createSupabaseServerClient();


export async function GET(req: Request) {
  

  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get("agent_id");

  let query = supabase
    .from("agent_commission_rules")
    .select("*")
    .order("valid_from", { ascending: false });

  if (agentId) {
    query = query.eq("agent_id", agentId);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch commission rules" },
      { status: 500 }
    );
  }

  return NextResponse.json({ items: data ?? [] });
}
