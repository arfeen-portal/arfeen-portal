import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const defaultModules = [
  "dashboard",
  "transport",
  "umrah",
  "hotels",
  "visa",
  "contact",
  "group_tickets",
  "agents",
  "accounts",
  "reports",
  "vouchers",
  "refunds",
  "airline_reports",
  "white_label",
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanDomain(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

function isValidDomain(value: string) {
  if (!value) return true;
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value);
}

function isValidEmail(value: string) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET() {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        {
          ok: false,
          error: "Supabase admin client is not configured.",
        },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from("saas_tenants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      tenants: data ?? [],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        {
          ok: false,
          error: "Supabase admin client is not configured.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();

    const tenantName = String(body.tenant_name || "").trim();

    const customDomain = body.custom_domain
      ? cleanDomain(String(body.custom_domain))
      : null;

    const contactEmail = body.contact_email
      ? String(body.contact_email).trim().toLowerCase()
      : null;

    if (!tenantName) {
      return NextResponse.json(
        {
          ok: false,
          error: "Tenant name is required.",
        },
        { status: 400 }
      );
    }

    if (customDomain && !isValidDomain(customDomain)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Custom domain format is invalid.",
        },
        { status: 400 }
      );
    }

    if (contactEmail && !isValidEmail(contactEmail)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Contact email format is invalid.",
        },
        { status: 400 }
      );
    }

    const slug = slugify(body.slug || tenantName);
    const subdomain = body.subdomain
      ? slugify(body.subdomain)
      : slug;

    if (!slug) {
      return NextResponse.json(
        {
          ok: false,
          error: "Valid tenant slug could not be generated.",
        },
        { status: 400 }
      );
    }

    if (customDomain) {
      const { data: existingDomain, error: domainError } =
        await supabase
          .from("saas_tenants")
          .select("id")
          .eq("custom_domain", customDomain)
          .maybeSingle();

      if (domainError) {
        return NextResponse.json(
          {
            ok: false,
            error: domainError.message,
          },
          { status: 500 }
        );
      }

      if (existingDomain) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "This domain is already attached to another tenant.",
          },
          { status: 409 }
        );
      }
    }

    const { data: existingSlug, error: slugError } =
      await supabase
        .from("saas_tenants")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

    if (slugError) {
      return NextResponse.json(
        {
          ok: false,
          error: slugError.message,
        },
        { status: 500 }
      );
    }

    if (existingSlug) {
      return NextResponse.json(
        {
          ok: false,
          error: "This tenant slug already exists.",
        },
        { status: 409 }
      );
    }

    const payload = {
      tenant_name: tenantName,
      slug,
      subdomain,
      custom_domain: customDomain,
      logo_url: body.logo_url || null,
      primary_color: body.primary_color || "#0f766e",
      secondary_color: body.secondary_color || "#111827",
      contact_email: contactEmail,
      contact_phone: body.contact_phone || null,
      bio: body.bio || null,
      plan_name: body.plan_name || "starter",
      allowed_modules: Array.isArray(body.allowed_modules)
        ? body.allowed_modules
        : defaultModules,
      status: "pending_approval",
      approval_status: "pending",
      domain_verified: false,
      approved_at: null,
      go_live_at: null,
    };

    const { data, error } = await supabase
      .from("saas_tenants")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      tenant: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        {
          ok: false,
          error: "Supabase admin client is not configured.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();

    const id = body.id;
    const action = body.action;

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          error: "Tenant id is required.",
        },
        { status: 400 }
      );
    }

    const { data: tenant, error: readError } =
      await supabase
        .from("saas_tenants")
        .select("*")
        .eq("id", id)
        .single();

    if (readError || !tenant) {
      return NextResponse.json(
        {
          ok: false,
          error: readError?.message || "Tenant not found.",
        },
        { status: 404 }
      );
    }

    let updatePayload: any = {};

    switch (action) {
      case "approve":
        updatePayload = {
          status: "approved_ready",
          approval_status: "approved",
          approved_by: body.approved_by || "admin",
          approved_at: new Date().toISOString(),
          rejection_reason: null,
        };
        break;

      case "reject":
        updatePayload = {
          status: "rejected",
          approval_status: "rejected",
          rejection_reason:
            body.rejection_reason ||
            "Rejected by admin.",
        };
        break;

      case "go_live":
        if (tenant.status !== "approved_ready") {
          return NextResponse.json(
            {
              ok: false,
              error:
                "Tenant must be approved before Go Live.",
            },
            { status: 400 }
          );
        }

        if (!tenant.custom_domain) {
          return NextResponse.json(
            {
              ok: false,
              error:
                "Custom domain required before Go Live.",
            },
            { status: 400 }
          );
        }

        updatePayload = {
          status: "live",
          approval_status: "approved",
          domain_verified: true,
          go_live_at: new Date().toISOString(),
        };
        break;

      case "update":
        updatePayload = {
          tenant_name: body.tenant_name,
          custom_domain: body.custom_domain
            ? cleanDomain(body.custom_domain)
            : null,
          logo_url: body.logo_url || null,
          primary_color: body.primary_color,
          secondary_color: body.secondary_color,
          contact_email: body.contact_email || null,
          contact_phone: body.contact_phone || null,
          bio: body.bio || null,
          plan_name: body.plan_name,
          allowed_modules: Array.isArray(
            body.allowed_modules
          )
            ? body.allowed_modules
            : [],
        };
        break;

      default:
        return NextResponse.json(
          {
            ok: false,
            error: "Invalid action.",
          },
          { status: 400 }
        );
    }

    const { data, error } = await supabase
      .from("saas_tenants")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      tenant: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}