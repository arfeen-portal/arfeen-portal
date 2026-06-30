import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  ARFEENPORTAL_DEMO_MODULES,
  portalModuleMapFromAllowed,
} from "@/lib/tenantModules";

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

  if (!tenantId) {
    const { data: saasTenant } = await supabase
      .from("saas_tenants")
      .select("id, allowed_modules, status, custom_domain")
      .eq("custom_domain", domain)
      .maybeSingle();

    if (saasTenant?.id) {
      tenantId = saasTenant.id;
      allowedModules = saasTenant.allowed_modules || [];
    }
  }

  if (!tenantId) {
    const fallbackModules =
      domain === "arfeenportal.com"
        ? portalModuleMapFromAllowed(ARFEENPORTAL_DEMO_MODULES)
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
      allowed_modules: domain === "arfeenportal.com" ? ARFEENPORTAL_DEMO_MODULES : [],
      settings: null,
    });
  }

  const { data: modules } = await supabase
    .from("portal_module_flags")
    .select("module_key, is_enabled")
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

  if (!Object.keys(moduleMap).length && allowedModules?.length) {
    moduleMap = portalModuleMapFromAllowed(allowedModules);
  }

  if (!Object.keys(moduleMap).length) {
    const { data: saasTenant } = await supabase
      .from("saas_tenants")
      .select("allowed_modules")
      .eq("id", tenantId)
      .maybeSingle();

    if (saasTenant?.allowed_modules?.length) {
      allowedModules = saasTenant.allowed_modules;
      moduleMap = portalModuleMapFromAllowed(saasTenant.allowed_modules);
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
    allowed_modules: allowedModules,
    settings,
  });
}
