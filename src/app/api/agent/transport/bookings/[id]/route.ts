import { withAgent } from "@/app/api/agent/_utils/withAgent";
import { requireModule } from "@/lib/guards/moduleGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const ctx = await withAgent(req);
  requireModule(ctx, "transport");

  const body = await req.json();

  await supabaseAdmin
    .from("transport_bookings")
    .update({ status: body.status })
    .eq("id", params.id)
    .eq("tenant_id", ctx.tenant_id)
    .eq("agent_id", ctx.agent_id);

  return Response.json({ success: true });
}
