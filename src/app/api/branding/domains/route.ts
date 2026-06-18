import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
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

type AuthorizedUser = {
  role: "super_admin" | "admin";
  tenantId: string | null;
};

async function requireDomainAdmin() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }),
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("tenant_id, role")
    .eq("email", user.email.toLowerCase())
    .maybeSingle<{ tenant_id: string | null; role: string | null }>();

  if (profileError || !profile?.role) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 }),
    };
  }

  if (profile.role !== "super_admin" && profile.role !== "admin") {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 }),
    };
  }

  if (profile.role === "admin" && !profile.tenant_id) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "Tenant not assigned to this user." }, { status: 403 }),
    };
  }

  return {
    ok: true as const,
    user: {
      role: profile.role,
      tenantId: profile.tenant_id ?? null,
    } as AuthorizedUser,
  };
}

export async function GET() {
  const auth = await requireDomainAdmin();
  if (!auth.ok) return auth.response;

  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase admin client is not configured." },
      { status: 500 }
    );
  }

  let query = supabase
    .from("portal_domains")
    .select("*");

  if (auth.user.role !== "super_admin") {
    query = query.eq("tenant_id", auth.user.tenantId);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    domains: data || [],
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireDomainAdmin();
  if (!auth.ok) return auth.response;

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
    let primaryQuery = supabase
      .from("portal_domains")
      .update({ is_primary: false })
      .eq("is_primary", true);

    if (auth.user.role !== "super_admin") {
      primaryQuery = primaryQuery.eq("tenant_id", auth.user.tenantId);
    }

    await primaryQuery;
  }

  const payload: Record<string, unknown> = {
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

  if (auth.user.role === "super_admin") {
    payload.tenant_id = body.tenant_id || null;
  } else {
    payload.tenant_id = auth.user.tenantId;
  }

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