import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function makeAgentCode(name: string) {
  const prefix = name
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 4)
    .toUpperCase();
  return `${prefix || "AGT"}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase admin client is not configured." },
        { status: 500 }
      );
    }

    const body = await req.json();

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "").trim();
    const phone = String(body.phone || "").trim();
    const country = String(body.country || "").trim();
    const city = String(body.city || "").trim();
    const commission_pct = Number(body.commission_pct || 0);
    const credit_limit = Number(body.credit_limit || 0);
    const billing_currency = String(body.billing_currency || "SAR").trim();
    const agent_code = String(body.agent_code || makeAgentCode(name)).trim();
    const portal_name = String(body.portal_name || `${name} Portal`).trim();
    const portal_slug = slugify(body.portal_slug || name || agent_code);
    const theme_key = String(body.theme_key || "classic-blue").trim();

    if (!name || !email || !password) {
      return NextResponse.json(
        { ok: false, error: "Name, email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: name,
          role: "agent",
        },
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        { ok: false, error: authError?.message || "Auth user creation failed." },
        { status: 400 }
      );
    }

    const authUserId = authData.user.id;

    const { data: appUser, error: userError } = await supabase
      .from("users")
      .insert([
        {
          auth_user_id: authUserId,
          full_name: name,
          email,
          phone,
          role: "agent",
          status: "active",
        },
      ])
      .select("*")
      .single();

    if (userError) {
      await supabase.auth.admin.deleteUser(authUserId);
      return NextResponse.json(
        { ok: false, error: userError.message },
        { status: 400 }
      );
    }

    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .insert([
        {
          user_id: authUserId,
          name,
          email,
          phone,
          country,
          city,
          agent_code,
          commission_pct,
          credit_limit,
          billing_currency,
          currency: billing_currency,
          status: "active",
          is_active: true,
          is_credit_blocked: false,
          login_enabled: true,
          password_set: true,
          portal_access: {
            dashboard: true,
            bookings: true,
            packages: true,
            hotel_demands: true,
            invoices: true,
            ledger: true,
            payments: true,
            profile: true,
          },
        },
      ])
      .select("*")
      .single();

    if (agentError) {
      await supabase.auth.admin.deleteUser(authUserId);
      return NextResponse.json(
        { ok: false, error: agentError.message },
        { status: 400 }
      );
    }

    const { data: portal, error: portalError } = await supabase
      .from("agent_portals")
      .insert([
        {
          agent_id: agent.id,
          agent_user_id: authUserId,
          portal_name,
          portal_slug,
          theme_key,
          welcome_text: `Welcome ${name}. Manage your bookings, invoices, ledger and package operations from one clean portal.`,
          status: "active",
        },
      ])
      .select("*")
      .single();

    if (portalError) {
      return NextResponse.json(
        {
          ok: true,
          warning: portalError.message,
          user: appUser,
          agent,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        message: "Agent login created successfully.",
        user: appUser,
        agent,
        portal,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}