import { NextResponse } from "next/server";
import { withAgent } from "@/app/api/agent/_utils/withAgent";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const ctx = await withAgent(req);
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "SERVICE_UNAVAILABLE" }, { status: 503 });
    }

    const { data, error } = await supabase
      .from("agent_ledger")
      .select("*")
      .eq("tenant_id", ctx.tenant_id)
      .eq("agent_id", ctx.agent_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ ledger: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
