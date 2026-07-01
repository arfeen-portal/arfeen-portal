import type { SupabaseClient } from "@supabase/supabase-js";

export type PortalDomainRow = {
  tenant_id?: string | null;
  domain: string | null;
  is_primary?: boolean | null;
  is_verified?: boolean | null;
};

export function cleanPortalDomain(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

export function resolveTenantDisplayDomain(
  portalDomains: PortalDomainRow[],
  saasCustomDomain?: string | null
): { domain: string | null; verified: boolean } {
  const rows = portalDomains
    .map((row) => ({
      domain: cleanPortalDomain(row.domain),
      is_primary: Boolean(row.is_primary),
      is_verified: Boolean(row.is_verified),
    }))
    .filter((row) => row.domain);

  const primaryVerified = rows.find((row) => row.is_primary && row.is_verified);
  if (primaryVerified) {
    return { domain: primaryVerified.domain, verified: true };
  }

  const verifiedPrimary = rows.find((row) => row.is_verified && row.is_primary);
  const anyVerified = rows.find((row) => row.is_verified);
  const verified = verifiedPrimary || anyVerified;
  if (verified) {
    return { domain: verified.domain, verified: true };
  }

  const primary = rows.find((row) => row.is_primary);
  if (primary) {
    return { domain: primary.domain, verified: primary.is_verified };
  }

  if (rows[0]) {
    return { domain: rows[0].domain, verified: rows[0].is_verified };
  }

  const fallback = cleanPortalDomain(saasCustomDomain);
  if (fallback) {
    return { domain: fallback, verified: false };
  }

  return { domain: null, verified: false };
}

export async function enrichTenantsWithDisplayDomains<
  T extends { id: string; custom_domain?: string | null }
>(supabase: SupabaseClient, tenants: T[]) {
  if (!tenants.length) return tenants;

  const { data: domainRows, error } = await supabase
    .from("portal_domains")
    .select("tenant_id, domain, is_primary, is_verified")
    .in(
      "tenant_id",
      tenants.map((tenant) => tenant.id)
    );

  if (error) {
    throw new Error(error.message);
  }

  const domainsByTenant = new Map<string, PortalDomainRow[]>();

  for (const row of domainRows || []) {
    if (!row.tenant_id) continue;
    const existing = domainsByTenant.get(row.tenant_id) || [];
    existing.push(row);
    domainsByTenant.set(row.tenant_id, existing);
  }

  return tenants.map((tenant) => {
    const resolved = resolveTenantDisplayDomain(
      domainsByTenant.get(tenant.id) || [],
      tenant.custom_domain ?? null
    );

    return {
      ...tenant,
      display_domain: resolved.domain,
      display_domain_verified: resolved.verified,
    };
  });
}

export async function resolveLiveDomainForTenant(
  supabase: SupabaseClient,
  tenantId: string,
  saasCustomDomain?: string | null
) {
  const { data: domainRows, error } = await supabase
    .from("portal_domains")
    .select("domain, is_primary, is_verified")
    .eq("tenant_id", tenantId);

  if (error) {
    throw new Error(error.message);
  }

  return resolveTenantDisplayDomain(domainRows || [], saasCustomDomain ?? null).domain;
}
