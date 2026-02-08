import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { withTenant } from "@/app/api/_utils/withTenant";

export async function withAgent(req: Request) {
  // 1️⃣ Resolve tenant (LOCKED)
  const tenantCtx = await withTenant(req as any);

  // 2️⃣ Read auth session
  const cookieStore = cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  if (!accessToken) {
    throw new Error("UNAUTHENTICATED");
  }

  // 3️⃣ Supabase (runtime only)
  const supabase = createSupabaseServerClient();
  if (!supabase) {
    throw new Error("SUPABASE_NOT_AVAILABLE");
  }

  // 4️⃣ Get user from token
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    throw new Error("INVALID_SESSION");
  }

  // 5️⃣ Map user → agent_profiles (tenant scoped)
  const { data: agent } = await supabase
    .from("agent_profiles")
    .select("*")
    .eq("tenant_id", tenantCtx.tenant_id)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!agent) {
    throw new Error("AGENT_NOT_FOUND");
  }

  // 6️⃣ Final context
  return {
    ...tenantCtx,
    agent_id: agent.id,
    agent_role: agent.role,
    agent,
    user,
  };
}
