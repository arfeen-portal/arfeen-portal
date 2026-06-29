import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const AGENT_LIST_COLUMNS =
  "id, user_id, company_name, name, country, city, admin_name, email, phone, website, address, currency, volume, services, status, login_enabled, created_at";

async function requireAgentAdmin() {
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
    .select("role")
    .eq("email", user.email.toLowerCase())
    .maybeSingle<{ role: string | null }>();

  if (profileError || !profile?.role) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 }),
    };
  }

  if (!["super_admin", "admin"].includes(profile.role)) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true as const };
}

function isApprovedStatus(status: string) {
  return status === "approved" || status === "active";
}

async function ensureAgentUserAccess(admin: any, agent: any) {
  if (!agent?.email) return;

  const email = String(agent.email).toLowerCase();
  const displayName =
    agent.admin_name || agent.company_name || agent.name || "Agent";

  const { data: existingUser } = await admin
    .from("users")
    .select("id, email, role")
    .eq("email", email)
    .maybeSingle();

  if (existingUser?.id) {
    await admin
      .from("users")
      .update({ role: "agent", status: "active" })
      .eq("id", existingUser.id);
    return;
  }

  if (!agent.user_id) return;

  await admin.from("users").insert([
    {
      id: agent.user_id,
      email,
      name: displayName,
      full_name: displayName,
      role: "agent",
      status: "active",
    },
  ]);
}

export async function GET(req: NextRequest) {
  const auth = await requireAgentAdmin();
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdminSafe();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "Supabase admin client not configured." },
      { status: 500 }
    );
  }

  const status = req.nextUrl.searchParams.get("status");

  let query = admin
    .from("agents")
    .select(AGENT_LIST_COLUMNS)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, agents: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAgentAdmin();
  if (!auth.ok) return auth.response;

  const admin = getSupabaseAdminSafe();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "Supabase admin client not configured." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "").trim();
  const status = String(body.status || "").trim() as
    | "pending"
    | "approved"
    | "blocked"
    | "active";

  if (!id || !status) {
    return NextResponse.json(
      { ok: false, error: "Agent id and status are required." },
      { status: 400 }
    );
  }

  if (!["pending", "approved", "blocked", "active"].includes(status)) {
    return NextResponse.json(
      { ok: false, error: "Invalid agent status." },
      { status: 400 }
    );
  }

  const { data: agent, error: agentError } = await admin
    .from("agents")
    .select(AGENT_LIST_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (agentError) {
    return NextResponse.json({ ok: false, error: agentError.message }, { status: 500 });
  }

  if (!agent) {
    return NextResponse.json({ ok: false, error: "Agent not found." }, { status: 404 });
  }

  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
    login_enabled: isApprovedStatus(status),
    is_active: isApprovedStatus(status),
  };

  const { data: updated, error: updateError } = await admin
    .from("agents")
    .update(updatePayload)
    .eq("id", id)
    .select(AGENT_LIST_COLUMNS)
    .single();

  if (updateError) {
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  if (isApprovedStatus(status)) {
    await ensureAgentUserAccess(admin, agent);
  }

  return NextResponse.json({ ok: true, agent: updated });
}
