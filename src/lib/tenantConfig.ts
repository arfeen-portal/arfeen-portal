export type TenantModuleKey =
  | "umrahPackages"
  | "groupTickets"
  | "hotels"
  | "transport"
  | "visa"
  | "contact"
  | "agentLogin"
  | "bookNow";

export type TenantConfig = {
  domain: string;
  brandName: string;
  shortName: string;
  tagline: string;
  logoText: string;
  theme: {
    primary: string;
    darkBg: string;
  };
  modules: Record<TenantModuleKey, boolean>;
};

const defaultTenant: TenantConfig = {
  domain: "default",
  brandName: "Arfeen Travel",
  shortName: "AT",
  tagline: "Premium Umrah & Travel Services",
  logoText: "AT",
  theme: {
    primary: "amber",
    darkBg: "#050816",
  },
  modules: {
    umrahPackages: true,
    groupTickets: true,
    hotels: true,
    transport: true,
    visa: true,
    contact: true,
    agentLogin: true,
    bookNow: true,
  },
};

const tenants: Record<string, TenantConfig> = {
  "localhost:3000": defaultTenant,
  "arfeenportal.com": defaultTenant,
  "www.arfeenportal.com": defaultTenant,
};

export function getTenantByHost(host?: string | null): TenantConfig {
  if (!host) return defaultTenant;

  const cleanHost = host.toLowerCase().replace(/^https?:\/\//, "");

  return tenants[cleanHost] || defaultTenant;
}