import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type TenantResult = {
  error: string | null;
  status: number;
  tenantId: string | null;
};

async function getTenantId(): Promise<TenantResult> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { error: "Supabase server client is not configured", status: 500, tenantId: null };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Unauthorized", status: 401, tenantId: null };
  }

  const tenantId =
    (user.user_metadata?.tenant_id as string | undefined) ||
    (user.app_metadata?.tenant_id as string | undefined) ||
    null;

  if (!tenantId) {
    return { error: "Tenant not found", status: 400, tenantId: null };
  }

  return { error: null, status: 200, tenantId };
}

export async function GET() {
  try {
    const { error, status, tenantId } = await getTenantId();

    if (error || !tenantId) {
      return NextResponse.json({ error }, { status });
    }

    const supabaseAdmin = getSupabaseAdminSafe();

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Supabase admin client is not configured" },
        { status: 500 }
      );
    }

    const { data, error: dbError } = await supabaseAdmin
      .from("portal_domains")
      .select(
        `
        *,
        theme:portal_themes(id, name, code, primary_color, secondary_color, accent_color)
      `
      )
      .eq("tenant_id", tenantId)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false });

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ domains: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch domains",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, status, tenantId } = await getTenantId();

    if (error || !tenantId) {
      return NextResponse.json({ error }, { status });
    }

    const supabaseAdmin = getSupabaseAdminSafe();

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Supabase admin client is not configured" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));

    if (body.is_primary === true) {
      await supabaseAdmin
        .from("portal_domains")
        .update({ is_primary: false })
        .eq("tenant_id", tenantId);
    }

    const payload = {
      tenant_id: tenantId,
      theme_id: body.theme_id || null,
      domain: String(body.domain ?? "").trim().toLowerCase(),
      subdomain: body.subdomain || null,
      host_type: body.host_type || "custom",
      is_primary: body.is_primary ?? false,
      is_verified: body.is_verified ?? false,
      verification_token: body.verification_token || crypto.randomUUID(),
      ssl_status: body.ssl_status || "pending",
      login_title: body.login_title || null,
      login_subtitle: body.login_subtitle || null,
      is_active: body.is_active ?? true,
    };

    if (!payload.domain) {
      return NextResponse.json({ error: "domain is required" }, { status: 400 });
    }

    const { data, error: dbError } = await supabaseAdmin
      .from("portal_domains")
      .insert([payload])
      .select("*")
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ domain: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create domain",
      },
      { status: 500 }
    );
  }
}