import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function loadTenantConfig(tenant_id: string) {
  const supabase = createSupabaseServerClient();

  const [
    { data: modules },
    { data: features },
    { data: whitelabel },
    { data: plan },
  ] = await Promise.all([
    supabase
      .from("tenant_modules")
      .select("*")
      .eq("tenant_id", tenant_id),

    supabase
      .from("tenant_features")
      .select("*")
      .eq("tenant_id", tenant_id),

    supabase
      .from("tenant_whitelabel")
      .select("*")
      .eq("tenant_id", tenant_id)
      .maybeSingle(),

    supabase
      .from("tenant_plans")
      .select("*")
      .eq("tenant_id", tenant_id)
      .maybeSingle(),
  ]);

  return {
    modules: modules ?? [],
    features: features ?? [],
    whitelabel,
    plan,
  };
}
