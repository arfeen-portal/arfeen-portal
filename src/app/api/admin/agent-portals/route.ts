import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

export async function GET() {
  try {
    const { error, status, tenantId } = await getTenantContext();

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
      .from("agent_portals")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    const portals = (data ?? []).map((row: any) => ({
      ...row,
      show_ledger: row.show_ledger ?? row.show_ledgers ?? true,
      theme_name: row.theme_name ?? null,
      domain: row.domain ?? null,
    }));

    return NextResponse.json({ portals });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch agent portals",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
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

    const portalName = String(body.portal_name ?? "").trim();
    const portalSlug = slugify(String(body.portal_slug ?? portalName));
    const agentId = String(body.agent_id ?? "").trim();

    if (!agentId || !portalName || !portalSlug) {
      return NextResponse.json(
        { error: "agent_id, portal_name and portal_slug are required" },
        { status: 400 }
      );
    }

    const { data: existingSlug, error: slugError } = await supabaseAdmin
      .from("agent_portals")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("portal_slug", portalSlug)
      .maybeSingle();

    if (slugError) {
      return NextResponse.json({ error: slugError.message }, { status: 500 });
    }

    if (existingSlug) {
      return NextResponse.json(
        { error: "This portal slug already exists for this tenant." },
        { status: 409 }
      );
    }

    const payload = {
      tenant_id: tenantId,
      agent_id: agentId,
      portal_name: portalName,
      portal_slug: portalSlug,
      theme_id: body.theme_id || null,
      domain_id: body.domain_id || null,

      show_transport: body.show_transport ?? true,
      show_hotels: body.show_hotels ?? true,
      show_packages: body.show_packages ?? true,
      show_ledger: body.show_ledger ?? body.show_ledgers ?? true,
      show_invoices: body.show_invoices ?? true,
      show_reports: body.show_reports ?? false,

      can_view_only_own_data: body.can_view_only_own_data ?? true,
      can_book_transport: body.can_book_transport ?? true,
      can_book_hotels: body.can_book_hotels ?? true,
      can_book_packages: body.can_book_packages ?? true,

      logo_url: body.logo_url || null,
      welcome_text: body.welcome_text || null,
      support_phone: body.support_phone || null,
      support_whatsapp: body.support_whatsapp || null,

      is_active: body.is_active ?? true,
      created_by: userId,
      updated_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error: dbError } = await supabaseAdmin
      .from("agent_portals")
      .insert([payload])
      .select("*")
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        portal: {
          ...data,
          show_ledger: data.show_ledger ?? data.show_ledgers ?? true,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create agent portal",
      },
      { status: 500 }
    );
  }
}