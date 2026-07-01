import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildPortalModuleFlagRows,
  normalizeAllowedModules,
  type ProvisioningModuleKey,
} from "@/lib/tenantModules";
import {
  buildPortalFeatureFlagRows,
  getDefaultFeaturesForModules,
  normalizeAllowedFeatures,
  sanitizeAllowedFeaturesForModules,
} from "@/lib/tenantFeatures";

function cleanDomain(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

export async function syncTenantPortalModules(
  supabase: SupabaseClient,
  params: {
    tenantId: string;
    customDomain: string | null;
    allowedModules: string[];
    allowedFeatures?: string[];
  }
) {
  const allowedModules = normalizeAllowedModules(params.allowedModules);

  if (!allowedModules.length) {
    throw new Error("At least one module must remain enabled.");
  }

  const allowedFeatures =
    params.allowedFeatures !== undefined
      ? sanitizeAllowedFeaturesForModules(allowedModules, params.allowedFeatures)
      : getDefaultFeaturesForModules(allowedModules);

  const domain = params.customDomain ? cleanDomain(params.customDomain) : null;

  if (domain) {
    const { data: existingDomain } = await supabase
      .from("portal_domains")
      .select("id, tenant_id")
      .eq("domain", domain)
      .maybeSingle();

    if (existingDomain?.id) {
      const { error: domainUpdateError } = await supabase
        .from("portal_domains")
        .update({
          tenant_id: params.tenantId,
          is_primary: true,
          is_verified: true,
          ssl_status: "active",
        })
        .eq("id", existingDomain.id);

      if (domainUpdateError) {
        throw new Error(domainUpdateError.message);
      }
    } else {
      const { error: domainInsertError } = await supabase.from("portal_domains").insert([
        {
          tenant_id: params.tenantId,
          domain,
          is_primary: true,
          is_verified: true,
          ssl_status: "active",
        },
      ]);

      if (domainInsertError) {
        throw new Error(domainInsertError.message);
      }
    }
  }

  const moduleRows = buildPortalModuleFlagRows(params.tenantId, allowedModules);
  const featureRows = buildPortalFeatureFlagRows(
    params.tenantId,
    allowedModules as ProvisioningModuleKey[],
    allowedFeatures
  );

  const { error: moduleDeleteError } = await supabase
    .from("portal_module_flags")
    .delete()
    .eq("tenant_id", params.tenantId);

  if (moduleDeleteError) {
    throw new Error(moduleDeleteError.message);
  }

  const { error: moduleInsertError } = await supabase
    .from("portal_module_flags")
    .insert(moduleRows);

  if (moduleInsertError) {
    throw new Error(moduleInsertError.message);
  }

  const { error: featureDeleteError } = await supabase
    .from("portal_feature_flags")
    .delete()
    .eq("tenant_id", params.tenantId);

  if (featureDeleteError) {
    throw new Error(featureDeleteError.message);
  }

  const { error: featureInsertError } = await supabase
    .from("portal_feature_flags")
    .insert(featureRows);

  if (featureInsertError) {
    throw new Error(featureInsertError.message);
  }

  return {
    tenantId: params.tenantId,
    domain,
    allowedModules,
    allowedFeatures,
    moduleCount: moduleRows.filter((row) => row.is_enabled).length,
    featureCount: featureRows.filter((row) => row.is_enabled).length,
  };
}
