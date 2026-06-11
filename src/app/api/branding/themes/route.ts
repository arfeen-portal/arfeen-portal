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

export async function GET() {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase admin client is not configured." },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("white_label_tenants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    themes: data || [],
  });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase admin client is not configured." },
      { status: 500 }
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
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { ok: false, error: existingError.message },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "This domain already has a theme." },
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
    .insert(payload)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    theme: data,
  });
}