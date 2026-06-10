import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function cleanDomain(host: string) {
  return host.toLowerCase().replace(/^www\./, "").split(":")[0];
}

export async function GET(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const domain = cleanDomain(host);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { ok: false, error: "Missing Supabase env variables." },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: domainRow, error: domainError } = await supabase
    .from("portal_domains")
    .select("tenant_id, domain, is_active")
    .eq("domain", domain)
    .eq("is_active", true)
    .maybeSingle();

  if (domainError || !domainRow) {
    return NextResponse.json({
      ok: true,
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

  const moduleMap =
    modules?.reduce<Record<string, boolean>>((acc, item) => {
      acc[item.module_key] = item.is_enabled;
      return acc;
    }, {}) || {};

  return NextResponse.json({
    ok: true,
    tenant: domainRow,
    modules: moduleMap,
    settings,
  });
}