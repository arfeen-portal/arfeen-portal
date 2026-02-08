import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function resolveTenant({
  domain,
  bundleId,
  agentCode,
}: {
  domain?: string;
  bundleId?: string;
  agentCode?: string;
}) {
  let tenant;

  // 1️⃣ DOMAIN (WEB)
  if (domain) {
    const { data } = await supabase
      .from("tenant_domains")
      .select("tenant_id, platform_tenants(*)")
      .eq("domain", domain)
      .maybeSingle();

    tenant = data?.platform_tenants;
  }

  // 2️⃣ BUNDLE ID (APP)
  if (!tenant && bundleId) {
    const { data } = await supabase
      .from("tenant_apps")
      .select("tenant_id, platform_tenants(*)")
      .eq("bundle_id", bundleId)
      .maybeSingle();

    tenant = data?.platform_tenants;
  }

  // 3️⃣ FALLBACK (agent_code)
  if (!tenant && agentCode) {
    const { data } = await supabase
      .from("platform_tenants")
      .select("*")
      .eq("tenant_code", agentCode)
      .maybeSingle();

    tenant = data;
  }

  if (!tenant) {
    throw new Error("TENANT_NOT_FOUND");
  }

  return tenant;
}
