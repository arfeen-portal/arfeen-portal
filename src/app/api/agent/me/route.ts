import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getBearerToken(req: NextRequest) {
  const header = req.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return null;
  return header.replace("Bearer ", "").trim();
}

export async function GET(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const admin = getSupabaseAdminSafe();

    if (!url || !anon || !admin) {
      return NextResponse.json(
        { ok: false, error: "Supabase configuration missing." },
        { status: 500 }
      );
    }

    const token = getBearerToken(req);

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Missing auth token." },
        { status: 401 }
      );
    }

    const userClient = createClient(url, anon, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { ok: false, error: "Invalid session." },
        { status: 401 }
      );
    }

    const { data: appUser } = await admin
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (!appUser || appUser.role !== "agent") {
      return NextResponse.json(
        { ok: false, error: "Agent access required." },
        { status: 403 }
      );
    }

    const { data: agent, error: agentError } = await admin
      .from("agents")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (agentError || !agent) {
      return NextResponse.json(
        { ok: false, error: "Agent profile not found." },
        { status: 404 }
      );
    }

    if (agent.login_enabled === false || agent.status === "suspended") {
      return NextResponse.json(
        { ok: false, error: "Agent login is disabled." },
        { status: 403 }
      );
    }

    const { data: portal } = await admin
      .from("agent_portals")
      .select("*")
      .eq("agent_id", agent.id)
      .maybeSingle();

    await admin
      .from("agents")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", agent.id);

    return NextResponse.json({
      ok: true,
      user: appUser,
      agent,
      portal,
    });
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