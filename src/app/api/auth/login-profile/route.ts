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
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.endsWith(".localhost")
  );
}

export async function GET(req: NextRequest) {
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
    const { data: tenant, error: tenantError } = await supabase
      .from("saas_tenants")
      .select("id,tenant_name,custom_domain,contact_email,status")
      .eq("custom_domain", host)
      .maybeSingle();

    if (tenantError) {
      return NextResponse.json(
        { ok: false, error: tenantError.message },
        { status: 500 }
      );
    }

    if (!tenant || tenant.status !== "live") {
      return NextResponse.json(
        { ok: false, error: "Live tenant not found for this domain." },
        { status: 403 }
      );
    }

    const tenantContactEmail = tenant.contact_email
      ? String(tenant.contact_email).toLowerCase()
      : null;

    const isTenantUser = profile.tenant_id === tenant.id;
    const isTenantContact = tenantContactEmail === email;

    if (!isTenantUser && !isTenantContact) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This user is not allowed to access this tenant domain.",
        },
        { status: 403 }
      );
    }
  }

  return NextResponse.json({
    ok: true,
    user: profile,
  });
}