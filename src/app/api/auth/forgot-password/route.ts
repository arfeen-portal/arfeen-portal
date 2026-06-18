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
    .replace(/^www\./, "")
    .replace(/:\d+$/, "")
    .replace(/\/.*$/, "");
}

function getRequestHosts(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const forwardedHost = req.headers.get("x-forwarded-host") || "";
  const origin = req.headers.get("origin") || req.nextUrl.origin || "";

  return Array.from(
    new Set([host, forwardedHost, origin].map(cleanHost).filter(Boolean))
  );
}

function isLocalHost(host: string) {
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function getTenantByDomain(supabase: any, hosts: string[]): Promise<TenantRow | null> {
  const domainList = Array.from(
    new Set(
      hosts.flatMap((h) => {
        const clean = cleanHost(h);
        return [clean, `www.${clean}`];
      })
    )
  );

  const { data: domainRow, error: domainError } = await supabase
    .from("portal_domains")
    .select("tenant_id, domain")
    .in("domain", domainList)
    .limit(1)
    .maybeSingle();

  if (domainError) throw domainError;
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

    const hosts = getRequestHosts(req);
    const isLocal = hosts.some(isLocalHost);

    let tenant: TenantRow | null = null;

    if (!isLocal) {
      tenant = await getTenantByDomain(supabase, hosts);

      if (!tenant) {
        return NextResponse.json(
          {
            ok: false,
            error: `Live tenant not found for this domain: ${hosts.join(", ")}`,
          },
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