import { NextResponse } from "next/server";
import { withAgent } from "@/app/api/agent/_utils/withAgent";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const ctx = await withAgent(req);
    const supabase = getSupabaseAdminClient();
    if (!supabase) return NextResponse.json({ error: "SERVICE_UNAVAILABLE" }, { status: 503 });

    const { data, error } = await supabase
      .from("transport_vehicles")
      .select("*")
      .eq("tenant_id", ctx.tenant_id);

    if (error) throw error;

    return NextResponse.json({ vehicles: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
