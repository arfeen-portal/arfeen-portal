import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdminSafe();

    if (!supabaseAdmin) {
      return NextResponse.json(
        { ok: false, error: "Supabase admin client not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();

    if (!name || !email) {
      return NextResponse.json(
        { ok: false, error: "Name and email are required" },
        { status: 400 }
      );
    }

    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
      });

    if (authError || !authUser?.user) {
      return NextResponse.json(
        {
          ok: false,
          error: authError?.message || "Failed to create auth user",
        },
        { status: 400 }
      );
    }

    const userId = authUser.user.id;

    const { error: userError } = await supabaseAdmin.from("users").insert([
      {
        id: userId,
        name,
        email,
        phone,
        role: "agent",
      },
    ]);

    if (userError) {
      return NextResponse.json(
        { ok: false, error: userError.message },
        { status: 400 }
      );
    }

    const { data: agent, error: agentError } = await supabaseAdmin
      .from("agents")
      .insert([
        {
          user_id: userId,
          name,
          email,
          phone,
          billing_currency: "PKR",
          currency: "PKR",
          is_credit_blocked: false,
          is_active: true,
          level: 1,
          default_commission: 0,
        },
      ])
      .select()
      .single();

    if (agentError) {
      return NextResponse.json(
        { ok: false, error: agentError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        userId,
        agent,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Agent invite error:", err);

    return NextResponse.json(
      { ok: false, error: "Unexpected server error" },
      { status: 500 }
    );
  }
}