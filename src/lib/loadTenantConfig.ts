import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function loadTenantConfig(tenant_id: string) {
  const [{ data: modules }, { data: features }, { data: whitelabel }, { data: plan }] =
    await Promise.all([
      supabase.from("tenant_modules").select("*").eq("tenant_id", tenant_id),
      supabase.from("tenant_features").select("*").eq("tenant_id", tenant_id),
      supabase.from("tenant_whitelabel").select("*").eq("tenant_id", tenant_id).maybeSingle(),
      supabase.from("tenant_plans").select("*").eq("tenant_id", tenant_id).maybeSingle(),
    ]);

  return {
    modules: modules ?? [],
    features: features ?? [],
    whitelabel,
    plan,
  };
}
