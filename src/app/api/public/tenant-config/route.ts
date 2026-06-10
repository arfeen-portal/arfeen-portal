import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ModuleRow = {
  module_key: string;
  is_enabled: boolean;
};

function cleanDomain(host: string) {
  return host.toLowerCase().replace(/^www\./, "").split(":")[0];
}

function fallbackResponse(host: string, domain: string) {
  return NextResponse.json({
    ok: true,
    source: "fallback",
    host,
    domain,
    tenant: null,
    modules: {},
    settings: null,
  });
}

export async function GET(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const domain = cleanDomain(host);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing Supabase env variables.",
        host,
        domain,
      },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: domainRow, error: domainError } = await supabase
    .from("portal_domains")
    .select("tenant_id, domain, is_primary, is_verified, ssl_status")
    .eq("domain", domain)
    .maybeSingle();

  if (domainError || !domainRow) {
    return fallbackResponse(host, domain);
  }

  const { data: modules, error: modulesError } = await supabase
    .from("portal_module_flags")
    .select("module_key, is_enabled")
    .eq("tenant_id", domainRow.tenant_id);

  if (modulesError) {
    return NextResponse.json(
      {
        ok: false,
        error: modulesError.message,
        host,
        domain,
      },
      { status: 500 }
    );
  }

  const { data: settings, error: settingsError } = await supabase
    .from("portal_settings")
    .select("*")
    .eq("tenant_id", domainRow.tenant_id)
    .maybeSingle();

  if (settingsError) {
    return NextResponse.json(
      {
        ok: false,
        error: settingsError.message,
        host,
        domain,
      },
      { status: 500 }
    );
  }

  const moduleMap = (modules || []).reduce<Record<string, boolean>>(
    (acc, item: ModuleRow) => {
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
    tenant: domainRow,
    modules: moduleMap,
    settings,
  });
}