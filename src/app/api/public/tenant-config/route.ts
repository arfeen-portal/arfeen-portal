import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  ARFEENPORTAL_DEMO_MODULES,
  portalModuleMapFromAllowed,
} from "@/lib/tenantModules";
import {
  ARFEENPORTAL_DEMO_FEATURES,
  buildFeatureMapFromAllowed,
  buildFeatureMapFromRows,
  featuresByModuleFromMap,
} from "@/lib/tenantFeatures";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function cleanDomain(host: string) {
  return host
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split(":")[0];
}

export async function GET(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const domain = cleanDomain(host);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ ok: false, error: "Missing env", host, domain });
  }

  const supabaseProject = supabaseUrl.split("//")[1]?.split(".")[0];

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: domainRow, error: domainError } = await supabase
    .from("portal_domains")
    .select("tenant_id, domain, is_primary, is_verified, ssl_status")
    .eq("domain", domain)
    .maybeSingle();

  let tenantId = domainRow?.tenant_id ?? null;
  let allowedModules: string[] | null = null;
  let allowedFeatures: string[] | null = null;

  if (!tenantId) {
    const { data: saasTenant } = await supabase
      .from("saas_tenants")
      .select("id, allowed_modules, allowed_features, status, custom_domain")
      .eq("custom_domain", domain)
      .maybeSingle();

    if (saasTenant?.id) {
      tenantId = saasTenant.id;
      allowedModules = saasTenant.allowed_modules || [];
      allowedFeatures = saasTenant.allowed_features || [];
    }
  }

  if (!tenantId) {
    const fallbackModules =
      domain === "arfeenportal.com"
        ? portalModuleMapFromAllowed(ARFEENPORTAL_DEMO_MODULES)
        : {};
    const fallbackFeatures =
      domain === "arfeenportal.com"
        ? buildFeatureMapFromAllowed(ARFEENPORTAL_DEMO_MODULES, [...ARFEENPORTAL_DEMO_FEATURES])
        : {};

    return NextResponse.json({
      ok: true,
      source: "fallback",
      reason: domainError?.message || "domain_not_found",
      host,
      domain,
      supabaseProject,
      tenant: null,
      modules: fallbackModules,
      features: fallbackFeatures,
      features_by_module: featuresByModuleFromMap(fallbackFeatures),
      allowed_modules: domain === "arfeenportal.com" ? ARFEENPORTAL_DEMO_MODULES : [],
      allowed_features: domain === "arfeenportal.com" ? ARFEENPORTAL_DEMO_FEATURES : [],
      settings: null,
    });
  }

  const { data: modules } = await supabase
    .from("portal_module_flags")
    .select("module_key, is_enabled")
    .eq("tenant_id", tenantId);

  const { data: featureRows } = await supabase
    .from("portal_feature_flags")
    .select("module_key, feature_key, is_enabled")
    .eq("tenant_id", tenantId);

  const { data: settings } = await supabase
    .from("portal_settings")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  let moduleMap = (modules || []).reduce<Record<string, boolean>>((acc, item) => {
    acc[item.module_key] = item.is_enabled;
    return acc;
  }, {});

  let featureMap = buildFeatureMapFromRows(featureRows || []);

  if (!Object.keys(moduleMap).length && allowedModules?.length) {
    moduleMap = portalModuleMapFromAllowed(allowedModules);
  }

  if (!Object.keys(moduleMap).length || !Object.keys(featureMap).length) {
    const { data: saasTenant } = await supabase
      .from("saas_tenants")
      .select("allowed_modules, allowed_features")
      .eq("id", tenantId)
      .maybeSingle();

    if (saasTenant?.allowed_modules?.length) {
      allowedModules = saasTenant.allowed_modules;
      moduleMap = portalModuleMapFromAllowed(saasTenant.allowed_modules);
    }

    if (saasTenant?.allowed_features?.length) {
      allowedFeatures = saasTenant.allowed_features;
    }

    if (!Object.keys(featureMap).length && saasTenant?.allowed_modules?.length) {
      featureMap = buildFeatureMapFromAllowed(
        saasTenant.allowed_modules,
        saasTenant.allowed_features || []
      );
    }
  }

  return NextResponse.json({
    ok: true,
    source: "database",
    host,
    domain,
    supabaseProject,
    tenant: domainRow || { tenant_id: tenantId, domain },
    modules: moduleMap,
    features: featureMap,
    features_by_module: featuresByModuleFromMap(featureMap),
    allowed_modules: allowedModules,
    allowed_features: allowedFeatures,
    settings,
  });
}
