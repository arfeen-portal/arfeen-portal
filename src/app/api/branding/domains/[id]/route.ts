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

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

async function verifyDomainOwnership(
  supabase: ReturnType<typeof getSupabaseAdminSafe>,
  id: string,
  user: AuthorizedUser
) {
  let query = supabase
    .from("portal_domains")
    .select("id, tenant_id")
    .eq("id", id);

  if (user.role !== "super_admin") {
    query = query.eq("tenant_id", user.tenantId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: error.message }, { status: 500 }),
    };
  }

  if (!data) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "Domain not found." }, { status: 404 }),
    };
  }

  return { ok: true as const };
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await requireDomainAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ ok: false, error: "Domain id is required." }, { status: 400 });
  }

  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase admin client is not configured." },
      { status: 500 }
    );
  }

  const ownership = await verifyDomainOwnership(supabase, id, auth.user);
  if (!ownership.ok) return ownership.response;

  const body = await req.json();

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
    let primaryQuery = supabase
      .from("portal_domains")
      .update({ is_primary: false })
      .neq("id", id);

    if (auth.user.role !== "super_admin") {
      primaryQuery = primaryQuery.eq("tenant_id", auth.user.tenantId);
    }

    await primaryQuery;
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

  let updateQuery = supabase
    .from("portal_domains")
    .update(payload)
    .eq("id", id);

  if (auth.user.role !== "super_admin") {
    updateQuery = updateQuery.eq("tenant_id", auth.user.tenantId);
  }

  const { data, error } = await updateQuery
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
  const auth = await requireDomainAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase admin client is not configured." },
      { status: 500 }
    );
  }

  const ownership = await verifyDomainOwnership(supabase, id, auth.user);
  if (!ownership.ok) return ownership.response;

  let deleteQuery = supabase
    .from("portal_domains")
    .delete()
    .eq("id", id);

  if (auth.user.role !== "super_admin") {
    deleteQuery = deleteQuery.eq("tenant_id", auth.user.tenantId);
  }

  const { error } = await deleteQuery;

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    deleted: true,
  });
}