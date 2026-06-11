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

type RouteContext = {
  params: Promise<{ id: string }>;
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
  const body = await req.json();

  if (!id) {
    return NextResponse.json({ ok: false, error: "Domain id is required." }, { status: 400 });
  }

  const payload: any = {
    updated_at: new Date().toISOString(),
  };

  if (body.domain !== undefined) {
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
      .neq("id", id)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ ok: false, error: existingError.message }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "This domain is already used by another record." },
        { status: 409 }
      );
    }

    payload.domain = domain;
  }

  if (body.is_primary === true) {
    await supabase
      .from("portal_domains")
      .update({ is_primary: false })
      .neq("id", id);
  }

  [
    "host_type",
    "status",
    "auto_detect",
    "is_primary",
    "is_verified",
    "ssl_status",
    "theme_id",
    "login_title",
    "login_subtitle",
  ].forEach((key) => {
    if (body[key] !== undefined) payload[key] = body[key] || null;
  });

  const { data, error } = await supabase
    .from("portal_domains")
    .update(payload)
    .eq("id", id)
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

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase admin client is not configured." },
      { status: 500 }
    );
  }

  const { id } = await context.params;

  const { error } = await supabase
    .from("portal_domains")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    deleted: true,
  });
}