import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function cleanDomain(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

function isValidDomain(value: string) {
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value);
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
    .from("portal_domains")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    domains: data || [],
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

  const body = await req.json();
  const domain = cleanDomain(body.domain);

  if (!domain || !isValidDomain(domain)) {
    return NextResponse.json(
      { ok: false, error: "Valid domain is required." },
      { status: 400 }
    );
  }

  const { data: existing, error: existingError } = await supabase
    .from("portal_domains")
    .select("id")
    .eq("domain", domain)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ ok: false, error: existingError.message }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json(
      { ok: false, error: "This domain already exists." },
      { status: 409 }
    );
  }

  if (body.is_primary) {
    await supabase
      .from("portal_domains")
      .update({ is_primary: false })
      .eq("is_primary", true);
  }

  const payload = {
    domain,
    host_type: body.host_type || "custom",
    status: body.status || "active",
    auto_detect: body.auto_detect ?? true,
    is_primary: body.is_primary ?? false,
    is_verified: body.is_verified ?? false,
    ssl_status: body.ssl_status || "pending",
    theme_id: body.theme_id || null,
    login_title: body.login_title || null,
    login_subtitle: body.login_subtitle || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("portal_domains")
    .insert([payload])
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    domain: data,
  });
}