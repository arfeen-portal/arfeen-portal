import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function cleanDomain(host: string) {
  return host.toLowerCase().replace(/^www\./, "").split(":")[0];
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

  const { data: allDomains, error: listError } = await supabase
    .from("portal_domains")
    .select("tenant_id, domain, is_primary, is_verified, ssl_status")
    .ilike("domain", "%arfeenportal%");

  const domainRow = allDomains?.find(
    (row) => row.domain?.toLowerCase() === domain
  );

  if (listError || !domainRow) {
    return NextResponse.json({
      ok: true,
      source: "fallback",
      reason: listError?.message || "domain_not_found",
      host,
      domain,
      supabaseProject,
      matchedDomains: allDomains || [],
      tenant: null,
      modules: {},
      settings: null,
    });
  }

  const { data: modules } = await supabase
    .from("portal_module_flags")
    .select("module_key, is_enabled")
    .eq("tenant_id", domainRow.tenant_id);

  const { data: settings } = await supabase
    .from("portal_settings")
    .select("*")
    .eq("tenant_id", domainRow.tenant_id)
    .maybeSingle();

  const moduleMap = (modules || []).reduce<Record<string, boolean>>(
    (acc, item) => {
      acc[item.module_key] = item.is_enabled;
      return acc;
    },
    {}
  );

  return NextResponse.json({
    ok: true,
    source: "database",
    host,
    domain,
    supabaseProject,
    tenant: domainRow,
    modules: moduleMap,
    settings,
  });
}