import { withAgent } from "@/app/api/agent/_utils/withAgent";
import { requireModule } from "@/lib/guards/moduleGuard";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
const supabaseAdmin = getSupabaseAdmin();

export async function GET(req: Request) {
  const ctx = await withAgent(req);
  requireModule(ctx, "transport");

  const { data } = await supabaseAdmin
    .from("transport_routes")
    .select("*")
    .eq("tenant_id", ctx.tenant_id)
    .eq("agent_id", ctx.agent_id);

  return Response.json(data ?? []);
}

export async function POST(req: Request) {
  const ctx = await withAgent(req);
  requireModule(ctx, "transport");

  const body = await req.json();

  await supabaseAdmin.from("transport_routes").insert({
    tenant_id: ctx.tenant_id,
    agent_id: ctx.agent_id,
    pickup_city: body.pickup_city,
    dropoff_city: body.dropoff_city,
    distance_km: body.distance_km,
  });

  return Response.json({ success: true });
}
