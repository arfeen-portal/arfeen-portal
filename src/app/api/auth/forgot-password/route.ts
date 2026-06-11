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

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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

    let tenant: any = null;

    if (!isLocalHost(host)) {
      const { data: tenantRow, error: tenantError } = await supabase
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

      if (!tenantRow || tenantRow.status !== "live") {
        return NextResponse.json(
          { ok: false, error: "Live tenant not found for this domain." },
          { status: 403 }
        );
      }

      tenant = tenantRow;
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

    const tenantContactEmail = tenant?.contact_email
      ? String(tenant.contact_email).toLowerCase()
      : null;

    const isTenantContactEmail = tenantContactEmail && tenantContactEmail === email;

    if (!profile && !isTenantContactEmail) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This email is not registered for this tenant/domain.",
        },
        { status: 403 }
      );
    }

    const redirectTo = `${origin}/reset-password`;

    const { error: resetError } =
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
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