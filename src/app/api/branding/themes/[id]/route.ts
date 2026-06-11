import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function cleanDomain(domain: unknown) {
  return String(domain || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");
}

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function isHexColor(value: unknown) {
  return typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value);
}

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase admin client is not configured." },
      { status: 500 }
    );
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Missing theme id." },
      { status: 400 }
    );
  }

  let body: any = {};

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const domain = cleanDomain(body.domain);
  const brandName = cleanText(body.brand_name || body.name);
  const logoUrl = cleanText(body.logo_url);

  const primaryColor = body.primary_color || "#0f172a";
  const secondaryColor = body.secondary_color || "#d4af37";
  const accentColor = body.accent_color || "#10b981";

  if (!brandName) {
    return NextResponse.json(
      { ok: false, error: "Brand name is required." },
      { status: 400 }
    );
  }

  if (!isHexColor(primaryColor) || !isHexColor(secondaryColor) || !isHexColor(accentColor)) {
    return NextResponse.json(
      { ok: false, error: "Theme colors must be valid hex colors." },
      { status: 400 }
    );
  }

  if (domain) {
    const { data: existing, error: existingError } = await supabase
      .from("white_label_tenants")
      .select("id")
      .eq("domain", domain)
      .neq("id", id)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { ok: false, error: existingError.message },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "This domain is already attached to another theme." },
        { status: 409 }
      );
    }
  }

  const payload = {
    name: brandName,
    brand_name: brandName,
    domain,
    logo_url: logoUrl || null,
    primary_color: primaryColor,
    secondary_color: secondaryColor,
    accent_color: accentColor,
    modules: body.modules ?? {},
    is_active: body.is_active ?? true,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("white_label_tenants")
    .update(payload)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { ok: false, error: "Theme not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    theme: data,
  });
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase admin client is not configured." },
      { status: 500 }
    );
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Missing theme id." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("white_label_tenants")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    deleted: true,
  });
}