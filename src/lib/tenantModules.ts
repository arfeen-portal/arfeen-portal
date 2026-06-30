import type { TenantModuleKey } from "@/lib/tenantConfig";

/** Canonical module keys stored in saas_tenants.allowed_modules and portal_module_flags.module_key */
export const PROVISIONING_MODULE_KEYS = [
  "dashboard",
  "transport",
  "umrah",
  "hotels",
  "visa",
  "contact",
  "group_tickets",
  "agents",
  "accounts",
  "reports",
  "vouchers",
  "refunds",
  "airline_reports",
  "white_label",
  "locator",
  "notifications",
  "search",
  "branding",
  "ai",
  "system",
] as const;

export type ProvisioningModuleKey = (typeof PROVISIONING_MODULE_KEYS)[number];

export const ARFEENPORTAL_DEMO_MODULES: ProvisioningModuleKey[] = [
  "dashboard",
  "group_tickets",
  "hotels",
  "accounts",
  "agents",
  "contact",
];

export const MASTER_DEFAULT_MODULES: ProvisioningModuleKey[] = [...PROVISIONING_MODULE_KEYS];

export const MODULE_LABELS: Record<ProvisioningModuleKey, string> = {
  dashboard: "Dashboard",
  transport: "Transport",
  umrah: "Umrah Packages",
  hotels: "Hotels",
  visa: "Visa",
  contact: "Contact / Book Now",
  group_tickets: "Group Tickets",
  agents: "Agents / B2B",
  accounts: "Accounts",
  reports: "Reports",
  vouchers: "Vouchers",
  refunds: "Refunds",
  airline_reports: "Airline / BSP Reports",
  white_label: "White Label",
  locator: "Locator",
  notifications: "Notifications",
  search: "Search",
  branding: "Branding",
  ai: "AI Tools",
  system: "System / Admin",
};

/** AppSidebar top-level section label → module key */
export const SIDEBAR_SECTION_MODULE: Record<string, ProvisioningModuleKey> = {
  Dashboard: "dashboard",
  Accounts: "accounts",
  Transport: "transport",
  Hotels: "hotels",
  Umrah: "umrah",
  Agents: "agents",
  Reports: "reports",
  Locator: "locator",
  Notifications: "notifications",
  Search: "search",
  Branding: "branding",
  Admin: "system",
  "AI Tools": "ai",
  System: "system",
};

export function normalizeAllowedModules(modules: unknown): ProvisioningModuleKey[] {
  if (!Array.isArray(modules)) return [];

  const allowed = new Set<ProvisioningModuleKey>();

  for (const raw of modules) {
    const key = String(raw || "").trim() as ProvisioningModuleKey;
    if (PROVISIONING_MODULE_KEYS.includes(key)) {
      allowed.add(key);
    }
  }

  return [...allowed];
}

export function isProvisioningModuleEnabled(
  enabledModules: Set<string> | string[],
  moduleKey: string
): boolean {
  const set = enabledModules instanceof Set ? enabledModules : new Set(enabledModules);

  if (moduleKey === "branding") {
    return set.has("branding") || set.has("white_label");
  }

  return set.has(moduleKey);
}

export function buildPortalModuleFlagRows(tenantId: string, allowedModules: string[]) {
  const allowed = new Set(normalizeAllowedModules(allowedModules));

  return PROVISIONING_MODULE_KEYS.map((moduleKey) => ({
    tenant_id: tenantId,
    module_key: moduleKey,
    is_enabled: isProvisioningModuleEnabled(allowed, moduleKey),
  }));
}

export function portalModuleMapFromAllowed(allowedModules: string[]) {
  const allowed = new Set(normalizeAllowedModules(allowedModules));

  return PROVISIONING_MODULE_KEYS.reduce<Record<string, boolean>>((acc, key) => {
    acc[key] = isProvisioningModuleEnabled(allowed, key);
    return acc;
  }, {});
}

export function portalModuleMapToTenantNavModules(
  moduleMap: Record<string, boolean>
): Record<TenantModuleKey, boolean> {
  return {
    umrahPackages: Boolean(moduleMap.umrah),
    groupTickets: Boolean(moduleMap.group_tickets),
    hotels: Boolean(moduleMap.hotels),
    transport: Boolean(moduleMap.transport),
    visa: Boolean(moduleMap.visa),
    contact: Boolean(moduleMap.contact),
    agentLogin: Boolean(moduleMap.agents),
    bookNow: Boolean(moduleMap.contact),
  };
}

export function allowedModulesToTenantNavModules(
  allowedModules: string[]
): Record<TenantModuleKey, boolean> {
  return portalModuleMapToTenantNavModules(portalModuleMapFromAllowed(allowedModules));
}

export function mergeTenantNavModules(
  base: Record<TenantModuleKey, boolean>,
  moduleMap: Record<string, boolean>
): Record<TenantModuleKey, boolean> {
  return {
    ...base,
    ...portalModuleMapToTenantNavModules(moduleMap),
  };
}
