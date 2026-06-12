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

function normalizeHost(host?: string | null): string {
  if (!host) return "";

  return host
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .replace(/:443$/, "")
    .replace(/:80$/, "");
}

const tenants: Record<string, TenantConfig> = {
  "localhost:3000": masterTenant,
  "127.0.0.1:3000": masterTenant,
  localhost: masterTenant,
  "127.0.0.1": masterTenant,

  "arfeenportal.com": clientTenant,
};

export function getTenantByHost(host?: string | null): TenantConfig {
  const cleanHost = normalizeHost(host);

  if (!cleanHost) return masterTenant;

  return tenants[cleanHost] || clientTenant;
}

export function isMasterHost(host?: string | null): boolean {
  return getTenantByHost(host).type === "master";
}

export function getNormalizedHost(host?: string | null): string {
  return normalizeHost(host);
}