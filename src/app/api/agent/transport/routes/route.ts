import { NextResponse } from "next/server";
import { withAgent } from "@/app/api/agent/_utils/withAgent";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const ctx = await withAgent(req);
    const supabase = supabaseAdmin;
     return NextResponse.json({ error: "SERVICE_UNAVAILABLE" }, { status: 503 });

    const { data, error } = await supabase
      .from("transport_routes")
      .select("*")
      .eq("tenant_id", ctx.tenant_id);

    if (error) throw error;

    return NextResponse.json({ routes: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
