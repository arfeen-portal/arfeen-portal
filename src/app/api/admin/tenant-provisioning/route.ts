import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const defaultModules = [
  "dashboard",
  "accounts",
  "transport",
  "umrah",
  "agents",
  "reports",
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase admin client is not configured." },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from("saas_tenants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, tenants: data ?? [] });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unexpected server error." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase admin client is not configured." },
        { status: 500 }
      );
    }

    const body = await req.json();

    const tenantName = String(body.tenant_name || "").trim();

    if (!tenantName) {
      return NextResponse.json(
        { ok: false, error: "Tenant name is required." },
        { status: 400 }
      );
    }

    const slug = slugify(body.slug || tenantName);
    const subdomain = body.subdomain ? slugify(body.subdomain) : slug;

    const payload = {
      tenant_name: tenantName,
      slug,
      subdomain,
      custom_domain: body.custom_domain || null,
      logo_url: body.logo_url || null,
      primary_color: body.primary_color || "#0f766e",
      secondary_color: body.secondary_color || "#111827",
      contact_email: body.contact_email || null,
      contact_phone: body.contact_phone || null,
      bio: body.bio || null,
      plan_name: body.plan_name || "starter",
      allowed_modules: Array.isArray(body.allowed_modules)
        ? body.allowed_modules
        : defaultModules,
      status: "pending_approval",
      approval_status: "pending",
      domain_verified: false,
    };

    const { data, error } = await supabase
      .from("saas_tenants")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, tenant: data });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unexpected server error." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase admin client is not configured." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const id = body.id;

    if (!id) {
      return NextResponse.json({ ok: false, error: "Tenant id is required." }, { status: 400 });
    }

    const action = body.action;

    let updatePayload: any = {};

    if (action === "approve") {
      updatePayload = {
        status: "approved_ready",
        approval_status: "approved",
        approved_by: body.approved_by || "admin",
        approved_at: new Date().toISOString(),
        rejection_reason: null,
      };
    }

    if (action === "reject") {
      updatePayload = {
        status: "rejected",
        approval_status: "rejected",
        rejection_reason: body.rejection_reason || "Rejected by admin.",
      };
    }

    if (action === "go_live") {
      updatePayload = {
        status: "live",
        approval_status: "approved",
        domain_verified: true,
        go_live_at: new Date().toISOString(),
      };
    }

    if (action === "update") {
      updatePayload = {
        tenant_name: body.tenant_name,
        custom_domain: body.custom_domain || null,
        logo_url: body.logo_url || null,
        primary_color: body.primary_color,
        secondary_color: body.secondary_color,
        contact_email: body.contact_email || null,
        contact_phone: body.contact_phone || null,
        bio: body.bio || null,
        plan_name: body.plan_name,
        allowed_modules: Array.isArray(body.allowed_modules) ? body.allowed_modules : [],
      };
    }

    if (!Object.keys(updatePayload).length) {
      return NextResponse.json({ ok: false, error: "Invalid action." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("saas_tenants")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, tenant: data });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unexpected server error." },
      { status: 500 }
    );
  }
}