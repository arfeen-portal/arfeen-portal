import { NextResponse, NextRequest } from "next/server";
import { withAgent } from "@/app/api/agent/_utils/withAgent";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = {
  id: string;
};

export async function PATCH(
  req: NextRequest,
  context: { params: Params }
) {
  try {
    const { params } = context;

    // 🔐 Resolve tenant + agent (LOCKED PATTERN)
    const ctx = await withAgent(req as any);

    // Dynamic SaaS payload
    const body = (await req.json()) as Record<string, any>;

    // 🚨 CRITICAL FIX: cast supabase CLIENT (not table)
    const supabase = getSupabaseAdminClient() as any;

    if (!supabase) {
      return NextResponse.json(
        { error: "SERVICE_UNAVAILABLE" },
        { status: 503 }
      );
    }

    const { error } = await supabase
      .from("transport_bookings")
      .update(body)
      .eq("id", params.id)
      .eq("tenant_id", ctx.tenant_id)
      .eq("agent_id", ctx.agent_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "UPDATE_FAILED" },
      { status: 400 }
    );
  }
}
