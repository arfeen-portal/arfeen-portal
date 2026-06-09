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
    return {
      error: "Supabase server client is not configured",
      status: 500,
      tenantId: null,
    };
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
      .from("agent_portals")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ portals: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch agent portals",
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

    const payload = {
      tenant_id: tenantId,
      agent_id: body.agent_id,
      portal_name: String(body.portal_name ?? "").trim(),
      portal_slug: String(body.portal_slug ?? "").trim().toLowerCase(),
      theme_id: body.theme_id || null,
      domain_id: body.domain_id || null,
      show_transport: body.show_transport ?? true,
      show_hotels: body.show_hotels ?? true,
      show_packages: body.show_packages ?? true,
      show_ledgers: body.show_ledgers ?? true,
      show_invoices: body.show_invoices ?? true,
      show_reports: body.show_reports ?? true,
      can_view_only_own_data: body.can_view_only_own_data ?? true,
      can_book_transport: body.can_book_transport ?? true,
      can_book_hotels: body.can_book_hotels ?? true,
      can_book_packages: body.can_book_packages ?? true,
      logo_url: body.logo_url || null,
      welcome_text: body.welcome_text || null,
      support_phone: body.support_phone || null,
      support_whatsapp: body.support_whatsapp || null,
      is_active: body.is_active ?? true,
    };

    if (!payload.agent_id || !payload.portal_name || !payload.portal_slug) {
      return NextResponse.json(
        { error: "agent_id, portal_name and portal_slug are required" },
        { status: 400 }
      );
    }

    const { data, error: dbError } = await supabaseAdmin
      .from("agent_portals")
      .insert([payload])
      .select("*")
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ portal: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create agent portal",
      },
      { status: 500 }
    );
  }
}