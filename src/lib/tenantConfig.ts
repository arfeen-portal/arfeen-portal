export type TenantType = "master" | "client";

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
  type: TenantType;
  domain: string;
  brandName: string;
  shortName: string;
  tagline: string;
  logoText: string;
  modules: Record<TenantModuleKey, boolean>;
};

export const masterTenant: TenantConfig = {
  type: "master",
  domain: "localhost:3000",
  brandName: "Arfeen Travel Portal",
  shortName: "Arfeen",
  tagline: "Master SaaS Backend & Travel Portal",
  logoText: "AT",
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

export const clientTenant: TenantConfig = {
  type: "client",
  domain: "arfeenportal.com",
  brandName: "Arfeen Portal",
  shortName: "AP",
  tagline: "Premium Umrah & Travel Services",
  logoText: "AP",
  modules: {
    umrahPackages: true,
    groupTickets: true,
    hotels: true,
    transport: true,
    visa: true,
    contact: true,
    agentLogin: false,
    bookNow: true,
  },
};

const tenants: Record<string, TenantConfig> = {
  "localhost:3000": masterTenant,
  "127.0.0.1:3000": masterTenant,

  "arfeenportal.com": clientTenant,
  "www.arfeenportal.com": clientTenant,
};

export function getTenantByHost(host?: string | null): TenantConfig {
  if (!host) return masterTenant;

  const cleanHost = host.toLowerCase().replace(/^https?:\/\//, "");

  return tenants[cleanHost] || clientTenant;
}

export function isMasterHost(host?: string | null) {
  return getTenantByHost(host).type === "master";
}