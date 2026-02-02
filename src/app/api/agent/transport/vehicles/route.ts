import { withAgent } from "@/app/api/agent/_utils/withAgent";
import { requireModule } from "@/lib/guards/moduleGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const ctx = await withAgent(req);
  requireModule(ctx, "transport");

  const { data } = await supabaseAdmin
    .from("transport_vehicles")
    .select("*")
    .eq("tenant_id", ctx.tenant_id)
    .eq("agent_id", ctx.agent_id);

  return Response.json(data ?? []);
}

export async function POST(req: Request) {
  const ctx = await withAgent(req);
  requireModule(ctx, "transport");

  const body = await req.json();

  await supabaseAdmin.from("transport_vehicles").insert({
    tenant_id: ctx.tenant_id,
    agent_id: ctx.agent_id,
    vehicle_type: body.vehicle_type,
    capacity: body.capacity,
    luggage: body.luggage,
  });

  return Response.json({ success: true });
}
