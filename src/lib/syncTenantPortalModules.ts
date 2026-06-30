import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildPortalModuleFlagRows,
  normalizeAllowedModules,
} from "@/lib/tenantModules";

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
  }
) {
  const allowedModules = normalizeAllowedModules(params.allowedModules);

  if (!allowedModules.length) {
    throw new Error("At least one module must remain enabled.");
  }

  const domain = params.customDomain ? cleanDomain(params.customDomain) : null;

  if (domain) {
    const { data: existingDomain } = await supabase
      .from("portal_domains")
      .select("id, tenant_id")
      .eq("domain", domain)
      .maybeSingle();

    if (existingDomain?.id) {
      await supabase
        .from("portal_domains")
        .update({
          tenant_id: params.tenantId,
          is_primary: true,
          is_verified: true,
          ssl_status: "active",
        })
        .eq("id", existingDomain.id);
    } else {
      await supabase.from("portal_domains").insert([
        {
          tenant_id: params.tenantId,
          domain,
          is_primary: true,
          is_verified: true,
          ssl_status: "active",
        },
      ]);
    }
  }

  const rows = buildPortalModuleFlagRows(params.tenantId, allowedModules);

  await supabase.from("portal_module_flags").delete().eq("tenant_id", params.tenantId);

  const { error: insertError } = await supabase.from("portal_module_flags").insert(rows);

  if (insertError) {
    throw new Error(insertError.message);
  }

  return {
    tenantId: params.tenantId,
    domain,
    allowedModules,
    moduleCount: rows.filter((row) => row.is_enabled).length,
  };
}
