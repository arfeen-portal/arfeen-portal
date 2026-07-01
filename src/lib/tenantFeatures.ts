import type { ProvisioningModuleKey } from "@/lib/tenantModules";

export type TenantFeatureDefinition = {
  module_key: ProvisioningModuleKey;
  feature_key: string;
  label: string;
  href: string;
  sidebar_section: string;
};

function feature(
  module_key: ProvisioningModuleKey,
  feature_key: string,
  label: string,
  href: string,
  sidebar_section: string
): TenantFeatureDefinition {
  return { module_key, feature_key, label, href, sidebar_section };
}

export const TENANT_FEATURE_REGISTRY: TenantFeatureDefinition[] = [
  feature("dashboard", "dashboard.home", "Dashboard", "/", "Dashboard"),

  feature("accounts", "accounts.home", "Accounts Home", "/accounts", "Accounts"),
  feature("accounts", "accounts.invoices", "Invoices", "/accounts/invoices", "Accounts"),
  feature("accounts", "accounts.invoices_new", "New Invoice", "/accounts/invoices/new", "Accounts"),
  feature("accounts", "accounts.chart_of_accounts", "Chart of Accounts", "/accounts/chart-of-accounts", "Accounts"),
  feature("accounts", "accounts.ledger", "Ledger", "/accounts/ledger", "Accounts"),
  feature("accounts", "accounts.agent_ledger", "Agent Ledger", "/accounts/agent-ledger", "Accounts"),
  feature("accounts", "accounts.ledger_import", "Ledger Import", "/accounts/ledger-import", "Accounts"),
  feature("accounts", "accounts.journal_entries", "Journal Entries", "/accounts/journal", "Accounts"),
  feature("accounts", "accounts.journal_entry", "Journal Entry", "/accounts/journal-entry", "Accounts"),
  feature("accounts", "accounts.vouchers", "Vouchers", "/accounts/vouchers", "Accounts"),
  feature("accounts", "accounts.cash_book", "Cash & Bank Book", "/accounts/cash-book", "Accounts"),
  feature("accounts", "accounts.trial_balance", "Trial Balance", "/accounts/trial-balance", "Accounts"),
  feature("accounts", "accounts.profit_loss", "Profit & Loss", "/accounts/reports/profit-loss", "Accounts"),
  feature("accounts", "accounts.balance_sheet", "Balance Sheet", "/accounts/reports/balance-sheet", "Accounts"),
  feature("accounts", "accounts.aging", "Aging", "/accounts/reports/aging", "Accounts"),
  feature("accounts", "accounts.outstanding", "Outstanding", "/accounts/reports/outstanding", "Accounts"),
  feature("accounts", "accounts.ai_decision", "AI Decision Widget", "/accounts/ai-decision", "Accounts"),
  feature("accounts", "accounts.profit_leak", "Profit Leak Detector", "/accounts/profit-leak-detector", "Accounts"),
  feature("accounts", "accounts.smart_alerts", "Smart Alerts", "/accounts/smart-alerts", "Accounts"),
  feature("accounts", "accounts.auto_reminders", "Auto Reminders", "/accounts/auto-reminders", "Accounts"),
  feature("accounts", "accounts.auto_driver_assign", "Auto Driver Assign", "/accounts/auto-driver-assign", "Accounts"),
  feature("accounts", "accounts.agent_scoring", "Agent Scoring", "/accounts/agent-scoring", "Accounts"),
  feature("accounts", "accounts.refunds", "Refund Control Center", "/accounts/refunds", "Accounts"),
  feature("accounts", "accounts.airline_reports", "Airline / BSP Reports", "/accounts/airline-reports", "Accounts"),
  feature("accounts", "accounts.voucher_intelligence", "Voucher Intelligence", "/accounts/voucher-intelligence", "Accounts"),
  feature("accounts", "accounts.ai_financial_health", "AI Financial Health", "/accounts/ai-financial-health", "Accounts"),
  feature("accounts", "accounts.strategic_intelligence", "Strategic Intelligence", "/accounts/strategic-intelligence", "Accounts"),
  feature("accounts", "accounts.market_intelligence", "Market Intelligence", "/accounts/market-intelligence", "Accounts"),
  feature("accounts", "accounts.umrah_ai_command", "AI Umrah Command Center", "/accounts/umrah-ai-command", "Accounts"),

  feature("transport", "transport.bookings", "Bookings", "/transport", "Transport"),
  feature("transport", "transport.new_booking", "New Booking", "/transport/new", "Transport"),
  feature("transport", "transport.drivers", "Drivers", "/transport/drivers", "Transport"),
  feature("transport", "transport.vehicles", "Vehicles", "/transport/vehicles", "Transport"),
  feature("transport", "transport.routes", "Routes", "/transport/routes", "Transport"),
  feature("transport", "transport.rates", "Rates", "/transport/rates", "Transport"),
  feature("transport", "transport.live_control", "Operations Live Control", "/oprations/live-control", "Transport"),

  feature("hotels", "hotels.khuraki_dashboard", "Khuraki Dashboard", "/admin/hotels/kuraki", "Hotels"),
  feature("hotels", "hotels.voucher_stays", "Voucher Stays", "/admin/hotels/kuraki/vouchers", "Hotels"),
  feature("hotels", "hotels.daily_runs", "Daily Runs", "/admin/hotels/kuraki/daily-runs", "Hotels"),
  feature("hotels", "hotels.khuraki_staff", "Khuraki Staff", "/admin/hotels/kuraki/staff", "Hotels"),
  feature("hotels", "hotels.incidents", "Incidents", "/admin/hotels/kuraki/incidents", "Hotels"),
  feature("hotels", "hotels.supplier_bills", "Supplier Bills", "/admin/hotels/kuraki/supplier-bills", "Hotels"),
  feature("hotels", "hotels.ai_logs", "AI Logs", "/admin/hotels/kuraki/ai-logs", "Hotels"),
  feature("hotels", "hotels.reports", "Reports", "/admin/hotels/kuraki/reports", "Hotels"),
  feature("hotels", "hotels.rfq_command_center", "Hotel RFQ Command Center", "/admin/hotels/offline-demands", "Hotels"),
  feature("hotels", "hotels.offline_request", "Offline Hotel Request", "/hotels/offline-demands/new", "Hotels"),
  feature("hotels", "hotels.agent_requests", "Agent Hotel Requests", "/agent/hotels", "Hotels"),

  feature("umrah", "umrah.packages", "Packages", "/umrah/packages", "Umrah"),
  feature("umrah", "umrah.packages_new", "New Package", "/umrah/packages/new", "Umrah"),
  feature("umrah", "umrah.hotels", "Hotels", "/umrah/hotels", "Umrah"),
  feature("umrah", "umrah.flights", "Flights", "/umrah/flights", "Umrah"),
  feature("umrah", "umrah.ai_package_import", "AI Package Import", "/umrah/ai-package-import", "Umrah"),
  feature("umrah", "umrah.ziyarat", "Ziyarat", "/umrah/ziyarat", "Umrah"),
  feature("umrah", "umrah.group_ticketing", "Group Ticketing", "/umrah/groups", "Umrah"),
  feature("umrah", "umrah.visa_inventory", "Visa Inventory", "/umrah/visa", "Umrah"),

  feature("group_tickets", "group_tickets.public_list", "Group Tickets (Public)", "/umrah/groups", "Umrah"),
  feature("group_tickets", "group_tickets.admin_setup", "Groups Admin Setup", "/admin/umrah-groups", "Admin"),

  feature("agents", "agents.dashboard", "Agent Dashboard", "/agents/dashboard", "Agents"),
  feature("agents", "agents.all_agents", "All Agents", "/admin/agents", "Agents"),
  feature("agents", "agents.commissions", "Commission Rules", "/agents/commissions", "Agents"),
  feature("agents", "agents.credit_control", "Credit Control", "/agents/credit-control", "Agents"),
  feature("agents", "agents.statements", "Statements", "/agents/statements", "Agents"),
  feature("agents", "agents.register", "Register Agent", "/agents/register", "Agents"),
  feature("agents", "agents.approvals", "Agent Approvals", "/admin/agents", "Agents"),
  feature("agents", "agents.rewards", "Rewards", "/agents/rewards", "Agents"),

  feature("reports", "reports.sales", "Sales Reports", "/reports/sales", "Reports"),
  feature("reports", "reports.travel", "Travel Reports", "/reports/travel", "Reports"),
  feature("reports", "reports.financial_analytics", "Financial Analytics", "/reports/financial-analytics", "Reports"),
  feature("reports", "reports.dashboard", "Dashboard Summary", "/reports/dashboard", "Reports"),
  feature("reports", "reports.cash_flow", "Cash Flow", "/reports/cash-flow", "Reports"),
  feature("reports", "reports.profit_loss", "Profit Loss", "/reports/profit-loss", "Reports"),
  feature("reports", "reports.trial_balance", "Trial Balance", "/reports/trial-balance", "Reports"),

  feature("locator", "locator.live", "Live Locator", "/locator/live", "Locator"),
  feature("locator", "locator.history", "Location History", "/locator/history", "Locator"),

  feature("notifications", "notifications.inbox", "Notifications", "/notifications", "Notifications"),
  feature("search", "search.global", "Search", "/search", "Search"),

  feature("branding", "branding.themes", "Themes", "/branding/themes", "Branding"),
  feature("branding", "branding.domains", "Domains", "/branding/domains", "Branding"),
  feature("branding", "branding.portal_separation", "Portal Separation", "/branding/portal-separation", "Branding"),

  feature("system", "system.admin_dashboard", "Admin Dashboard", "/admin/dashboard", "Admin"),
  feature("system", "system.admin_analytics", "Admin Analytics", "/admin/analytics", "Admin"),
  feature("system", "system.accounting_admin", "Accounting Admin", "/admin/accounting", "Admin"),
  feature("system", "system.agent_portals", "Agent Portals", "/admin/agent-portals", "Admin"),
  feature("system", "system.umrah_groups", "Admin Group Setup", "/admin/umrah-groups", "Admin"),
  feature("system", "system.tenant_provisioning", "Tenant Provisioning", "/admin/tenant-provisioning", "Admin"),
  feature("system", "system.ai_saas_onboarding", "AI SaaS Onboarding", "/admin/ai-saas-onboarding", "Admin"),
  feature("system", "system.travel_intelligence", "Travel Intelligence Suite", "/admin/travel-intelligence-suite", "Admin"),
  feature("system", "system.agents_admin", "Agents Admin", "/admin/agents", "Admin"),
  feature("system", "system.users", "Users", "/admin/users", "Admin"),
  feature("system", "system.roles", "Roles & Guards", "/admin/roles", "Admin"),
  feature("system", "system.settings_roles", "Settings Roles", "/admin/settings/roles", "Admin"),
  feature("system", "system.permission_matrix", "Permission Matrix", "/admin/permission-matrix", "Admin"),
  feature("system", "system.themes", "White Label Themes", "/admin/themes", "Admin"),
  feature("system", "system.domain_mapping", "Domain Mapping", "/branding/domains", "Admin"),
  feature("system", "system.integration_api", "Integration API Testing", "/admin/integration-api-testing", "Admin"),
  feature("system", "system.automation", "Automation Center", "/admin/automation", "Admin"),
  feature("system", "system.auto_driver_assign", "Auto Driver Assign", "/admin/automation/auto-driver-assign", "Admin"),
  feature("system", "system.profit_lock", "Profit Lock", "/admin/automation/profit-lock", "Admin"),
  feature("system", "system.whatsapp_engine", "WhatsApp Engine", "/admin/automation/whatsapp-engine", "Admin"),
  feature("system", "system.credit_control", "Credit Control", "/admin/credit-control", "Admin"),
  feature("system", "system.driver_tracking", "Driver Tracking", "/admin/driver-tracking", "Admin"),
  feature("system", "system.manifests", "Manifests Preview", "/admin/manifests/preview", "Admin"),
  feature("system", "system.new_package", "New Package", "/admin/packages/new", "Admin"),
  feature("system", "system.log_anomalies", "Log Anomalies", "/admin/log-anomalies", "Admin"),
  feature("system", "system.logs", "System Logs", "/admin/logs", "Admin"),

  feature("ai", "ai.prediction_engine", "Prediction Engine", "/ai/prediction-engine", "AI Tools"),
  feature("ai", "ai.umrah_planner", "AI Umrah Planner", "/ai-umrah-planner", "AI Tools"),
  feature("ai", "ai.live_map", "Live Map", "/ai/live-map", "AI Tools"),
  feature("ai", "ai.saas_onboarding", "SaaS Onboarding", "/ai/saas-onboarding", "AI Tools"),
  feature("ai", "ai.innovation_suite", "AI Innovation Suite", "/ai/innovation-suite", "AI Tools"),

  feature("system", "system.settings", "Settings", "/settings", "System"),
  feature("system", "system.tenants", "Tenants", "/tenants", "System"),
  feature("system", "system.integrations", "Integrations", "/integrations", "System"),
];

export const ARFEENPORTAL_DEMO_FEATURES = [
  "dashboard.home",
  "accounts.home",
  "accounts.invoices",
  "accounts.invoices_new",
  "accounts.chart_of_accounts",
  "accounts.ledger",
  "accounts.agent_ledger",
  "accounts.journal_entries",
  "accounts.journal_entry",
  "accounts.vouchers",
  "hotels.offline_request",
  "hotels.agent_requests",
  "hotels.rfq_command_center",
  "agents.dashboard",
  "agents.approvals",
  "agents.register",
  "agents.all_agents",
  "group_tickets.public_list",
  "group_tickets.admin_setup",
] as const;

const FEATURE_BY_HREF = new Map<string, TenantFeatureDefinition>();
const FEATURE_BY_KEY = new Map<string, TenantFeatureDefinition>();

for (const item of TENANT_FEATURE_REGISTRY) {
  FEATURE_BY_KEY.set(item.feature_key, item);
  if (!FEATURE_BY_HREF.has(item.href)) {
    FEATURE_BY_HREF.set(item.href, item);
  }
}

export function getFeatureForMenuItem(
  label: string,
  href: string
): TenantFeatureDefinition | undefined {
  return TENANT_FEATURE_REGISTRY.find((item) => item.href === href && item.label === label);
}

export function getFeatureByHref(href: string): TenantFeatureDefinition | undefined {
  return FEATURE_BY_HREF.get(href);
}

export function getFeatureByKey(featureKey: string): TenantFeatureDefinition | undefined {
  return FEATURE_BY_KEY.get(featureKey);
}

export function getFeaturesForModule(moduleKey: ProvisioningModuleKey): TenantFeatureDefinition[] {
  return TENANT_FEATURE_REGISTRY.filter((item) => item.module_key === moduleKey);
}

export function normalizeAllowedFeatures(features: unknown): string[] {
  if (!Array.isArray(features)) return [];

  const allowed = new Set<string>();

  for (const raw of features) {
    const key = String(raw || "").trim();
    if (FEATURE_BY_KEY.has(key)) {
      allowed.add(key);
    }
  }

  return [...allowed];
}

export function getDefaultFeaturesForModules(modules: ProvisioningModuleKey[]): string[] {
  const moduleSet = new Set(modules);

  return TENANT_FEATURE_REGISTRY.filter((item) => moduleSet.has(item.module_key)).map(
    (item) => item.feature_key
  );
}

export function buildPortalFeatureFlagRows(
  tenantId: string,
  allowedModules: ProvisioningModuleKey[],
  allowedFeatures: string[]
) {
  const moduleSet = new Set(allowedModules);
  const featureSet = new Set(normalizeAllowedFeatures(allowedFeatures));

  return TENANT_FEATURE_REGISTRY.map((item) => ({
    tenant_id: tenantId,
    module_key: item.module_key,
    feature_key: item.feature_key,
    is_enabled: moduleSet.has(item.module_key) && featureSet.has(item.feature_key),
  }));
}

export function buildFeatureMapFromRows(rows: { feature_key: string; is_enabled: boolean }[]) {
  return rows.reduce<Record<string, boolean>>((acc, row) => {
    acc[row.feature_key] = row.is_enabled;
    return acc;
  }, {});
}

export function buildFeatureMapFromAllowed(
  allowedModules: ProvisioningModuleKey[],
  allowedFeatures: string[]
) {
  const moduleSet = new Set(allowedModules);
  const featureSet = new Set(normalizeAllowedFeatures(allowedFeatures));

  return TENANT_FEATURE_REGISTRY.reduce<Record<string, boolean>>((acc, item) => {
    acc[item.feature_key] = moduleSet.has(item.module_key) && featureSet.has(item.feature_key);
    return acc;
  }, {});
}

export function featuresByModuleFromMap(featureMap: Record<string, boolean>) {
  return TENANT_FEATURE_REGISTRY.reduce<Record<string, Record<string, boolean>>>((acc, item) => {
    if (!acc[item.module_key]) {
      acc[item.module_key] = {};
    }
    acc[item.module_key][item.feature_key] = Boolean(featureMap[item.feature_key]);
    return acc;
  }, {});
}

export function resolveFeatureEnabled(params: {
  isMaster: boolean;
  hasFeatureFlags: boolean;
  moduleEnabled: boolean;
  featureKey: string;
  featureMap: Record<string, boolean>;
}) {
  if (params.isMaster) return true;
  if (!params.moduleEnabled) return false;
  if (!params.hasFeatureFlags) return true;
  return params.featureMap[params.featureKey] === true;
}
