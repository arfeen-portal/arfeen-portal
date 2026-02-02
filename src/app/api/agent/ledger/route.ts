import { withAgent } from "@/app/api/agent/_utils/withAgent";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  const ctx = await withAgent(req);

  const { data } = await supabaseAdmin
    .from("agent_ledger")
    .select("*")
    .eq("tenant_id", ctx.tenant_id)
    .eq("agent_id", ctx.agent_id)
    .order("created_at", { ascending: false });

  return Response.json(data ?? []);
}
