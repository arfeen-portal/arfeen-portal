import { resolveTenant } from "./tenantResolver";
import { loadTenantConfig } from "./loadTenantConfig";

export async function getTenantContext(params: {
  domain?: string;
  bundleId?: string;
  agentCode?: string;
}) {
  const tenant = await resolveTenant(params);
  const config = await loadTenantConfig(tenant.id);

  return {
    tenant_id: tenant.id,
    tenant_code: tenant.tenant_code,
    environment: tenant.environment,
    ...config,
  };
}
