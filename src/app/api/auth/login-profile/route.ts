import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function cleanHost(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/:\d+$/, "")
    .replace(/\/.*$/, "");
}

function isLocalHost(host: string) {
  return host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost");
}

async function getTenantByDomain(supabase: any, host: string) {
  const { data: domainRow, error: domainError } = await supabase
    .from("portal_domains")
    .select("tenant_id, domain, is_verified, ssl_status")
    .eq("domain", host)
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

  return tenantRow;
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

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Missing auth token." },
        { status: 401 }
      );
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

    const host = cleanHost(req.headers.get("host") || "");

    if (!isLocalHost(host)) {
      const tenant = await getTenantByDomain(supabase, host);

      if (!tenant) {
        return NextResponse.json(
          { ok: false, error: "Live tenant not found for this domain." },
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

    return NextResponse.json({
      ok: true,
      user: profile,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unexpected server error." },
      { status: 500 }
    );
  }
}