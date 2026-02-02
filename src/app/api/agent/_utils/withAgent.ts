import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { withTenant } from "@/app/api/_utils/withTenant";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function withAgent(req: Request) {
  // 1️⃣ Resolve tenant first (LOCKED PATTERN)
  const tenantCtx = await withTenant(req as any);

  // 2️⃣ Read auth session (Supabase Auth)
  const cookieStore = cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;

  if (!accessToken) {
    throw new Error("UNAUTHENTICATED");
  }

  // 3️⃣ Get user from token
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    throw new Error("INVALID_SESSION");
  }

  // 4️⃣ Map user → agent_profiles (tenant-scoped)
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

  // 5️⃣ Final context (this is GOLD)
  return {
    ...tenantCtx,
    agent_id: agent.id,
    agent_role: agent.role,
    agent,
    user,
  };
}
