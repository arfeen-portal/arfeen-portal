import { createSupabaseServerClient } from "@/lib/supabaseServer";

type ResolveTenantInput = {
  domain?: string;
  bundleId?: string;
  agentCode?: string;
};

export async function resolveTenant({
  domain,
  bundleId,
  agentCode,
}: ResolveTenantInput) {
  const supabase = createSupabaseServerClient();

  let tenant: any = null;

  // 🌐 DOMAIN (WEB)
  if (domain) {
    const { data } = await supabase
      .from("tenant_domains")
      .select("tenant_id, platform_tenants(*)")
      .eq("domain", domain)
      .maybeSingle();

    tenant = data?.platform_tenants;
  }

  // 📦 BUNDLE ID (APP)
  if (!tenant && bundleId) {
    const { data } = await supabase
      .from("tenant_apps")
      .select("tenant_id, platform_tenants(*)")
      .eq("bundle_id", bundleId)
      .maybeSingle();

    tenant = data?.platform_tenants;
  }

  // 🧾 FALLBACK (AGENT CODE)
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
