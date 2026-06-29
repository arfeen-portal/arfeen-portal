import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeDomain(value: string | null) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .split(",")[0]
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/:\d+$/, "")
    .replace(/\/.*$/, "");
}

function getRequestHost(req: NextRequest) {
  return (
    normalizeDomain(req.headers.get("x-forwarded-host")) ||
    normalizeDomain(req.headers.get("x-vercel-forwarded-host")) ||
    normalizeDomain(req.headers.get("host"))
  );
}

function isLocalHost(host: string) {
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost");
}

async function getTenantByDomain(supabase: any, host: string) {
  const domainVariants = Array.from(new Set([host, `www.${host}`]));

  const { data: domainRows, error: domainError } = await supabase
    .from("portal_domains")
    .select("tenant_id, domain, is_verified, ssl_status")
    .in("domain", domainVariants);

  if (domainError) throw domainError;

  const domainRow = domainRows?.[0];

  if (!domainRow?.tenant_id) return null;

  const { data: tenantRow, error: tenantError } = await supabase
    .from("tenants")
    .select("id,name,is_active")
    .eq("id", domainRow.tenant_id)
    .eq("is_active", true)
    .maybeSingle();

  if (tenantError) throw tenantError;

  return tenantRow || null;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase admin client not configured." },
        { status: 500 }
      );
    }

    const token = (req.headers.get("authorization") || "")
      .replace("Bearer ", "")
      .trim();

    if (!token) {
      return NextResponse.json({ ok: false, error: "Missing auth token." }, { status: 401 });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user?.email) {
      return NextResponse.json(
        { ok: false, error: userError?.message || "Unauthorized." },
        { status: 401 }
      );
    }

    const email = user.email.toLowerCase();

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id,email,role,tenant_id")
      .eq("email", email)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { ok: false, error: profileError.message },
        { status: 500 }
      );
    }

    if (!profile?.role) {
      return NextResponse.json(
        { ok: false, error: "User role not found in public.users." },
        { status: 403 }
      );
    }

    const host = getRequestHost(req);

    if (!isLocalHost(host)) {
      const tenant = await getTenantByDomain(supabase, host);

      if (!tenant) {
        return NextResponse.json(
          { ok: false, error: `Live tenant not found for this domain: ${host}` },
          { status: 403 }
        );
      }

      if (profile.tenant_id !== tenant.id) {
        return NextResponse.json(
          { ok: false, error: "This user is not allowed to access this tenant domain." },
          { status: 403 }
        );
      }
    }

    const { data: agentRow } = await supabase
      .from("agents")
      .select("status, login_enabled")
      .eq("email", email)
      .maybeSingle();

    if (agentRow) {
      const approved =
        agentRow.status === "approved" || agentRow.status === "active";
      const loginAllowed = agentRow.login_enabled !== false;

      if (!approved || !loginAllowed) {
        const message =
          agentRow.status === "blocked"
            ? "Your agent account has been blocked. Contact admin."
            : "Your agent registration is pending admin approval.";

        return NextResponse.json({ ok: false, error: message }, { status: 403 });
      }
    } else if (profile.role === "agent") {
      return NextResponse.json(
        {
          ok: false,
          error: "Agent profile not found or pending admin approval.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ ok: true, user: profile });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unexpected server error." },
      { status: 500 }
    );
  }
}