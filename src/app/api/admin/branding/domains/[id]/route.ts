import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
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
      theme_id: body.theme_id,
      domain:
        typeof body.domain === "string"
          ? body.domain.toLowerCase().trim()
          : undefined,
      subdomain: body.subdomain,
      host_type: body.host_type,
      is_primary: body.is_primary,
      is_verified: body.is_verified,
      ssl_status: body.ssl_status,
      login_title: body.login_title,
      login_subtitle: body.login_subtitle,
      is_active: body.is_active,
      updated_at: new Date().toISOString(),
    };

    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined)
    );

    const { data, error: dbError } = await supabaseAdmin
      .from("portal_domains")
      .update(cleanPayload)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select("*")
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ domain: data });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update domain",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
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

    const { error: dbError } = await supabaseAdmin
      .from("portal_domains")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete domain",
      },
      { status: 500 }
    );
  }
}