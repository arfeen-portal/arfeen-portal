import { withAgent } from "@/app/api/agent/_utils/withAgent";

export async function GET(req: Request) {
  const ctx = await withAgent(req);

  return Response.json({
    agent: {
      id: ctx.agent_id,
      name: ctx.agent.name,
      role: ctx.agent_role,
    },
    tenant_id: ctx.tenant_id,
    modules: ctx.modules,
  });
}
