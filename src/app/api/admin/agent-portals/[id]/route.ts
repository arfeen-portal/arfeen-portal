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
  userId: string | null;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function getTenantContext(): Promise<TenantResult> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      error: "Supabase server client is not configured",
      status: 500,
      tenantId: null,
      userId: null,
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Unauthorized", status: 401, tenantId: null, userId: null };
  }

  const tenantId =
    (user.user_metadata?.tenant_id as string | undefined) ||
    (user.app_metadata?.tenant_id as string | undefined) ||
    null;

  if (!tenantId) {
    return {
      error:
        "Tenant not found. Add tenant_id in user metadata/app metadata or connect this admin user with master tenant.",
      status: 400,
      tenantId: null,
      userId: user.id,
    };
  }

  return { error: null, status: 200, tenantId, userId: user.id };
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { error, status, tenantId, userId } = await getTenantContext();

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

    const payload = {
      portal_name: body.portal_name,
      portal_slug:
        typeof body.portal_slug === "string" ? slugify(body.portal_slug) : undefined,

      theme_id: body.theme_id,
      domain_id: body.domain_id,

      show_transport: body.show_transport,
      show_hotels: body.show_hotels,
      show_packages: body.show_packages,
      show_ledger: body.show_ledger ?? body.show_ledgers,
      show_invoices: body.show_invoices,
      show_reports: body.show_reports,

      can_view_only_own_data: body.can_view_only_own_data,
      can_book_transport: body.can_book_transport,
      can_book_hotels: body.can_book_hotels,
      can_book_packages: body.can_book_packages,

      logo_url: body.logo_url,
      welcome_text: body.welcome_text,
      support_phone: body.support_phone,
      support_whatsapp: body.support_whatsapp,

      is_active: body.is_active,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    };

    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined)
    );

    const { data, error: dbError } = await supabaseAdmin
      .from("agent_portals")
      .update(cleanPayload)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select("*")
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      portal: {
        ...data,
        show_ledger: data.show_ledger ?? data.show_ledgers ?? true,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update agent portal",
      },
      { status: 500 }
    );
  }
}