import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getHost(req: NextRequest) {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = forwardedHost || req.headers.get("host") || "";
  return host.split(":")[0].toLowerCase();
}

export async function GET(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdminSafe();

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Supabase admin client is not configured" },
        { status: 500 }
      );
    }

    const host = getHost(req);

    const { data: domain, error: domainError } = await supabaseAdmin
      .from("portal_domains")
      .select("tenant_id, domain")
      .eq("domain", host)
      .maybeSingle();

    if (domainError) {
      return NextResponse.json({ error: domainError.message }, { status: 500 });
    }

    let query = supabaseAdmin
      .from("portal_themes")
      .select("*")
      .eq("is_active", true)
      .eq("is_default", true)
      .limit(1)
      .maybeSingle();

    if (domain?.tenant_id) {
      query = supabaseAdmin
        .from("portal_themes")
        .select("*")
        .eq("tenant_id", domain.tenant_id)
        .eq("is_active", true)
        .eq("is_default", true)
        .limit(1)
        .maybeSingle();
    }

    const { data: theme, error: themeError } = await query;

    if (themeError) {
      return NextResponse.json({ error: themeError.message }, { status: 500 });
    }

    if (!theme) {
      return NextResponse.json({
        theme: {
          primary_color: "#2563eb",
          secondary_color: "#0f172a",
          accent_color: "#f59e0b",
          header_bg: "#ffffff",
          sidebar_bg: "#0f172a",
          card_bg: "#ffffff",
          text_color: "#111827",
          muted_text_color: "#6b7280",
          border_color: "#e5e7eb",
          font_family: "Inter",
          border_radius: "18px",
          animation_settings: {
            button_hover: "scale",
            card_reveal: "fadeUp",
            page_transition: "slideRight",
            navbar_style: "glass",
          },
          ui_settings: {
            glass_opacity: 0.72,
            shadow_style: "soft",
            gradient_style: "premium",
            layout_density: "comfortable",
            animation_speed: "normal",
          },
        },
      });
    }

    return NextResponse.json({ theme });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch public theme",
      },
      { status: 500 }
    );
  }
}