import { withAgent } from "@/app/api/agent/_utils/withAgent";
import { requireModule } from "@/lib/guards/moduleGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const ctx = await withAgent(req);
  requireModule(ctx, "transport");

  const { data } = await supabaseAdmin
    .from("transport_pricing")
    .select("*")
    .eq("tenant_id", ctx.tenant_id)
    .eq("agent_id", ctx.agent_id);

  return Response.json(data ?? []);
}

export async function POST(req: Request) {
  const ctx = await withAgent(req);
  requireModule(ctx, "transport");

  const body = await req.json();

  await supabaseAdmin.from("transport_pricing").insert({
    tenant_id: ctx.tenant_id,
    agent_id: ctx.agent_id,
    route_id: body.route_id,
    vehicle_id: body.vehicle_id,
    price: body.price,
    currency: "SAR",
  });

  return Response.json({ success: true });
}
