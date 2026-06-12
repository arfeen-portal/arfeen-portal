import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type TenantRow = {
  id: string;
  name: string | null;
  is_active: boolean | null;
};

function cleanHost(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/:\d+$/, "")
    .replace(/\/.*$/, "");
}

function normalizeDomain(value: string) {
  return cleanHost(value).replace(/^www\./, "");
}

function isLocalHost(host: string) {
  const normalized = normalizeDomain(host);

  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized.endsWith(".localhost")
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function getTenantByDomain(supabase: any, rawHost: string): Promise<TenantRow | null> {
  const host = normalizeDomain(rawHost);

  if (!host) return null;

  const { data: domains, error: domainError } = await supabase
    .from("portal_domains")
    .select("tenant_id, domain, is_verified, ssl_status");

  if (domainError) throw domainError;

  const domainRow = (domains || []).find((row: any) => {
    const dbDomain = normalizeDomain(String(row.domain || ""));
    return dbDomain === host;
  });

  if (!domainRow?.tenant_id) return null;

  const { data: tenantRow, error: tenantError } = await supabase
    .from("tenants")
    .select("id,name,is_active")
    .eq("id", domainRow.tenant_id)
    .maybeSingle();

  if (tenantError) throw tenantError;

  if (!tenantRow?.id || tenantRow.is_active !== true) return null;

  return tenantRow as TenantRow;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase admin client not configured." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Valid email address is required." },
        { status: 400 }
      );
    }

    const host = cleanHost(req.headers.get("host") || "");
    const origin = req.nextUrl.origin;

    let tenant: TenantRow | null = null;

    if (!isLocalHost(host)) {
      tenant = await getTenantByDomain(supabase, host);

      if (!tenant) {
        return NextResponse.json(
          { ok: false, error: "Live tenant not found for this domain." },
          { status: 403 }
        );
      }
    }

    let userQuery = supabase
      .from("users")
      .select("id,email,tenant_id,role")
      .eq("email", email);

    if (tenant?.id) {
      userQuery = userQuery.eq("tenant_id", tenant.id);
    }

    const { data: profile, error: profileError } = await userQuery.maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { ok: false, error: profileError.message },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { ok: false, error: "This email is not registered for this tenant/domain." },
        { status: 403 }
      );
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });

    if (resetError) {
      return NextResponse.json(
        { ok: false, error: resetError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Password reset link sent.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unexpected server error." },
      { status: 500 }
    );
  }
}