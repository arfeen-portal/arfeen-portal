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

const defaultAnimationSettings = {
  button_hover: "scale",
  card_reveal: "fadeUp",
  page_transition: "slideRight",
  navbar_style: "glass",
};

const defaultUiSettings = {
  glass_opacity: 0.72,
  shadow_style: "soft",
  gradient_style: "premium",
  layout_density: "comfortable",
  animation_speed: "normal",
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

function cleanHex(value: unknown, fallback: string) {
  const text = String(value ?? "").trim();

  if (/^#[0-9A-Fa-f]{6}$/.test(text)) {
    return text;
  }

  return fallback;
}

function cleanText(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
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

    const supabaseAdmin = getSupabaseAdminSafe();

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Supabase admin client is not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const name = cleanText(body.name);
    const code = cleanText(body.code).toLowerCase();

    if (!name || !code) {
      return NextResponse.json(
        { error: "name and code are required" },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9-]+$/.test(code)) {
      return NextResponse.json(
        { error: "Theme code can only contain lowercase letters, numbers, and hyphens" },
        { status: 400 }
      );
    }

    if (body.is_default === true) {
      const { error: unsetError } = await supabaseAdmin
        .from("portal_themes")
        .update({ is_default: false })
        .eq("tenant_id", tenantId);

      if (unsetError) {
        return NextResponse.json({ error: unsetError.message }, { status: 500 });
      }
    }

    const payload = {
      tenant_id: tenantId,
      name,
      code,
      is_default: Boolean(body.is_default),
      logo_url: body.logo_url || null,
      favicon_url: body.favicon_url || null,
      login_bg_url: body.login_bg_url || null,

      primary_color: cleanHex(body.primary_color, "#2563eb"),
      secondary_color: cleanHex(body.secondary_color, "#0f172a"),
      accent_color: cleanHex(body.accent_color, "#f59e0b"),
      header_bg: cleanHex(body.header_bg, "#ffffff"),
      sidebar_bg: cleanHex(body.sidebar_bg, "#0f172a"),
      card_bg: cleanHex(body.card_bg, "#ffffff"),
      text_color: cleanHex(body.text_color, "#111827"),
      muted_text_color: cleanHex(body.muted_text_color, "#6b7280"),
      border_color: cleanHex(body.border_color, "#e5e7eb"),

      font_family: cleanText(body.font_family, "Inter"),
      border_radius: cleanText(body.border_radius, "18px"),
      custom_css: body.custom_css || null,
      animation_settings: body.animation_settings ?? defaultAnimationSettings,
      ui_settings: body.ui_settings ?? defaultUiSettings,
      is_active: body.is_active ?? true,
    };

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