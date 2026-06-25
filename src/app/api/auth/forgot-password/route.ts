import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PortalDomainRow = {
  tenant_id?: string | null;
  domain?: string | null;
  is_active?: boolean | null;
  is_verified?: boolean | null;
  ssl_status?: string | null;
};

function cleanHost(value: string) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .split(",")[0]
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
}

function getRequestDomain(req: NextRequest, bodyDomain?: string | null) {
  return (
    cleanHost(bodyDomain || "") ||
    cleanHost(req.headers.get("x-forwarded-host") || "") ||
    cleanHost(req.headers.get("x-vercel-forwarded-host") || "") ||
    cleanHost(req.headers.get("host") || "")
  );
}

function isLocalHost(host: string) {
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function getTenantIdByDomain(supabase: any, domain: string) {
  const { data, error } = await supabase
    .from("portal_domains")
    .select("tenant_id, domain, is_active, is_verified, ssl_status")
    .eq("domain", domain)
    .maybeSingle();

  if (error) throw error;

  const domainRow = data as PortalDomainRow | null;

  const active = domainRow?.is_active === true;
  const verified = domainRow?.is_verified !== false;
  const sslActive = !domainRow?.ssl_status || domainRow.ssl_status === "active";
  const tenantId = domainRow?.tenant_id || null;

  console.log("forgot-password domain lookup", {
    normalizedDomain: domain,
    domainRowFound: Boolean(domainRow),
    tenantId,
  });

  if (!tenantId || !active || !verified || !sslActive) return null;

  return tenantId;
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

    const email = String(body?.email || "").trim().toLowerCase();
    const normalizedDomain = getRequestDomain(req, body?.domain);

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { ok: false, error: "Valid email address is required." },
        { status: 400 }
      );
    }

    const isLocal = isLocalHost(normalizedDomain);
    let tenantId: string | null = null;

    if (!isLocal) {
      tenantId = await getTenantIdByDomain(supabase, normalizedDomain);

      if (!tenantId) {
        return NextResponse.json(
          {
            ok: false,
            error: `Live tenant not found for this domain: ${normalizedDomain}`,
          },
          { status: 403 }
        );
      }
    }

    let userQuery = supabase
      .from("users")
      .select("id,email,tenant_id,role")
      .eq("email", email);

    if (tenantId) {
      userQuery = userQuery.eq("tenant_id", tenantId);
    }

    const { data: profile, error: profileError } = await userQuery.maybeSingle();

    console.log("forgot-password user lookup", {
      normalizedDomain,
      tenantId,
      emailFound: Boolean(profile),
    });

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
      redirectTo: `${req.nextUrl.origin}/reset-password`,
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