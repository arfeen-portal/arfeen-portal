import { withAgent } from "@/app/api/agent/_utils/withAgent";
import { requireModule } from "@/lib/guards/moduleGuard";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
const supabaseAdmin = getSupabaseAdmin();

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/agent/transport/bookings
 * Agent-wise, tenant-safe bookings list
 */
export async function GET(req: Request) {
  const ctx = await withAgent(req);
  requireModule(ctx, "transport");

  const { data, error } = await supabaseAdmin
    .from("transport_bookings")
    .select("*")
    .eq("tenant_id", ctx.tenant_id)
    .eq("agent_id", ctx.agent_id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("GET transport bookings error:", error);
    return Response.json(
      { error: "Failed to load bookings" },
      { status: 500 }
    );
  }

  return Response.json({ bookings: data ?? [] });
}
