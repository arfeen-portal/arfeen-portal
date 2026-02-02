import { NextRequest, NextResponse } from "next/server";
import { withAgent } from "@/app/api/agent/_utils/withAgent";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  // 🚫 ABSOLUTE BUILD STOP
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ stats: null });
  }

  const ctx = await withAgent(req as any);
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "SERVICE_UNAVAILABLE" },
      { status: 503 }
    );
  }

  const { count } = await supabase
    .from("transport_bookings")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", ctx.tenant_id);

  return NextResponse.json({
    bookings: count ?? 0,
  });
}
