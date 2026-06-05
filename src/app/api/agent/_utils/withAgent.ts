import { cookies } from "next/headers";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";
import { withTenant } from "@/app/api/_utils/withTenant";

export type AgentContext = {
  tenantCtx: any;
  tenant_id: string;
  tenantId: string;
  agent_id: string;
  agentId: string;
  agent_role: string | null;
  agentRole: string | null;
  agent: any;
  user: any;
};

export async function withAgent(req: Request): Promise<AgentContext> {
  const tenantCtx: any = await withTenant(req as any);

  const tenantId =
    tenantCtx?.["tenant_id"] ??
    tenantCtx?.["tenantId"] ??
    tenantCtx?.["tenant"]?.["id"] ??
    null;

  if (!tenantId) {
    throw new Error("TENANT_NOT_FOUND");
  }

  const cookieStore = await cookies();

  const accessToken =
    cookieStore.get("sb-access-token")?.value ??
    cookieStore.get("supabase-auth-token")?.value ??
    cookieStore.get("sb:token")?.value ??
    null;

  if (!accessToken) {
    throw new Error("UNAUTHENTICATED");
  }

  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    throw new Error("SUPABASE_NOT_AVAILABLE");
  }

  const userRes = await supabase.auth.getUser(accessToken);

  if (userRes.error || !userRes.data.user) {
    throw new Error("INVALID_SESSION");
  }

  const user = userRes.data.user;

  const { data: agent, error: agentError } = await supabase
    .from("agent_profiles")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (agentError) {
    throw agentError;
  }

  if (!agent) {
    throw new Error("AGENT_NOT_FOUND");
  }

  return {
    tenantCtx,
    tenant_id: tenantId,
    tenantId,
    agent_id: agent.id,
    agentId: agent.id,
    agent_role: agent.role ?? null,
    agentRole: agent.role ?? null,
    agent,
    user,
  };
}