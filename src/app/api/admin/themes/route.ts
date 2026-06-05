import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdminSafe";

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
    return {
      error: "Tenant not found on user metadata",
      status: 400,
      tenantId: null,
    };
  }

  return { error: null, status: 200, tenantId };
}

export async function GET() {
  try {
    const { error, status, tenantId } = await getTenantId();

    if (error || !tenantId) {
      return NextResponse.json({ error }, { status });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Supabase admin client is not configured" },
        { status: 500 }
      );
    }

    const { data, error: dbError } = await supabaseAdmin
      .from("portal_themes")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ themes: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch themes",
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

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Supabase admin client is not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();

    if (body.is_default === true) {
      await supabaseAdmin
        .from("portal_themes")
        .update({ is_default: false })
        .eq("tenant_id", tenantId);
    }

    const payload = {
      tenant_id: tenantId,
      name: String(body.name ?? "").trim(),
      code: String(body.code ?? "").trim(),
      is_default: Boolean(body.is_default),
      logo_url: body.logo_url || null,
      favicon_url: body.favicon_url || null,
      login_bg_url: body.login_bg_url || null,
      primary_color: body.primary_color || "#1d4ed8",
      secondary_color: body.secondary_color || "#0f172a",
      accent_color: body.accent_color || "#f59e0b",
      header_bg: body.header_bg || "#ffffff",
      sidebar_bg: body.sidebar_bg || "#0f172a",
      card_bg: body.card_bg || "#ffffff",
      text_color: body.text_color || "#111827",
      muted_text_color: body.muted_text_color || "#6b7280",
      border_color: body.border_color || "#e5e7eb",
      font_family: body.font_family || "Inter",
      border_radius: body.border_radius || "16px",
      custom_css: body.custom_css || null,
      is_active: body.is_active ?? true,
    };

    if (!payload.name || !payload.code) {
      return NextResponse.json(
        { error: "name and code are required" },
        { status: 400 }
      );
    }

    const { data, error: dbError } = await supabaseAdmin
      .from("portal_themes")
      .insert([payload])
      .select("*")
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ theme: data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create theme",
      },
      { status: 500 }
    );
  }
}