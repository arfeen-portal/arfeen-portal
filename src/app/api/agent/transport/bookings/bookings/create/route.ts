import { NextResponse } from "next/server";
import { withAgent } from "@/app/api/agent/_utils/withAgent";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const ctx = await withAgent(req as any);
    const body = await req.json();

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "SERVICE_UNAVAILABLE" },
        { status: 503 }
      );
    }

    const { error } = await supabase.from("transport_bookings").insert({
      ...body,
      tenant_id: ctx.tenant_id,
      agent_id: ctx.agent_id,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? "CREATE_FAILED" },
      { status: 400 }
    );
  }
}
