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

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
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
    return {
      error: "Unauthorized",
      status: 401,
      tenantId: null,
    };
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

  return {
    error: null,
    status: 200,
    tenantId,
  };
}

function cleanHex(value: unknown) {
  const text = String(value ?? "").trim();
  return /^#[0-9A-Fa-f]{6}$/.test(text) ? text : undefined;
}

function cleanText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || undefined;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Theme id is required" }, { status: 400 });
    }

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

    const body = await req.json();

    if (body.is_default === true) {
      const { error: unsetError } = await supabaseAdmin
        .from("portal_themes")
        .update({ is_default: false })
        .eq("tenant_id", tenantId);

      if (unsetError) {
        return NextResponse.json({ error: unsetError.message }, { status: 500 });
      }
    }

    const payload: Record<string, unknown> = {};

    if (typeof body.name !== "undefined") payload.name = cleanText(body.name);
    if (typeof body.code !== "undefined") {
      const code = cleanText(body.code)?.toLowerCase();

      if (code && !/^[a-z0-9-]+$/.test(code)) {
        return NextResponse.json(
          { error: "Theme code can only contain lowercase letters, numbers, and hyphens" },
          { status: 400 }
        );
      }

      payload.code = code;
    }

    if (typeof body.is_default !== "undefined") payload.is_default = Boolean(body.is_default);
    if (typeof body.is_active !== "undefined") payload.is_active = Boolean(body.is_active);

    if (typeof body.logo_url !== "undefined") payload.logo_url = body.logo_url || null;
    if (typeof body.favicon_url !== "undefined") payload.favicon_url = body.favicon_url || null;
    if (typeof body.login_bg_url !== "undefined") payload.login_bg_url = body.login_bg_url || null;

    if (typeof body.primary_color !== "undefined") payload.primary_color = cleanHex(body.primary_color);
    if (typeof body.secondary_color !== "undefined") payload.secondary_color = cleanHex(body.secondary_color);
    if (typeof body.accent_color !== "undefined") payload.accent_color = cleanHex(body.accent_color);
    if (typeof body.header_bg !== "undefined") payload.header_bg = cleanHex(body.header_bg);
    if (typeof body.sidebar_bg !== "undefined") payload.sidebar_bg = cleanHex(body.sidebar_bg);
    if (typeof body.card_bg !== "undefined") payload.card_bg = cleanHex(body.card_bg);
    if (typeof body.text_color !== "undefined") payload.text_color = cleanHex(body.text_color);
    if (typeof body.muted_text_color !== "undefined") payload.muted_text_color = cleanHex(body.muted_text_color);
    if (typeof body.border_color !== "undefined") payload.border_color = cleanHex(body.border_color);

    if (typeof body.font_family !== "undefined") payload.font_family = cleanText(body.font_family);
    if (typeof body.border_radius !== "undefined") payload.border_radius = cleanText(body.border_radius);
    if (typeof body.custom_css !== "undefined") payload.custom_css = body.custom_css || null;

    if (typeof body.animation_settings !== "undefined") {
      payload.animation_settings = body.animation_settings;
    }

    if (typeof body.ui_settings !== "undefined") {
      payload.ui_settings = body.ui_settings;
    }

    Object.keys(payload).forEach((key) => {
      if (typeof payload[key] === "undefined") {
        delete payload[key];
      }
    });

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    const { data, error: dbError } = await supabaseAdmin
      .from("portal_themes")
      .update(payload)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select("*")
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ theme: data });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update theme",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Theme id is required" }, { status: 400 });
    }

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
      .from("portal_themes")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .eq("is_default", false);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete theme",
      },
      { status: 500 }
    );
  }
}