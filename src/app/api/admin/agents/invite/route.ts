import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, tenantId } = await req.json();

    if (!email || !name) {
      return NextResponse.json(
        { ok: false, error: "Name and email are required" },
        { status: 400 }
      );
    }

    // 1) Auth user create
    const { data: authResult, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
      });

    if (authError || !authResult?.user) {
      return NextResponse.json(
        { ok: false, error: authError?.message ?? "Failed to create auth user" },
        { status: 400 }
      );
    }

    const userId = authResult.user.id;

    // 2) public.users me row (role = 'agent')
    const { error: appUserError } = await supabaseAdmin.from("users").insert({
      id: userId,
      email,
      role: "agent",
    });

    if (appUserError) {
      return NextResponse.json(
        { ok: false, error: appUserError.message },
        { status: 400 }
      );
    }

    // 3) agents table me row, link with user_id
    const { data: agent, error: agentError } = await supabaseAdmin
      .from("agents")
      .insert({
        tenant_id: tenantId ?? null,
        name,
        email,
        phone,
        status: "approved",
        billing_currency: "PKR", // ya jo default chaho
        currency: "PKR",
        is_credit_blocked: false,
        user_id: userId,
        is_active: true,
        level: 1,
        default_commission: 0,
      })
      .select("*")
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
  } catch (err: any) {
    console.error("Agent invite error", err);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
