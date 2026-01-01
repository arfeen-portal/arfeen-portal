import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabaseAdmin = getSupabaseServerClient();

  // ✅ build-time safety
  if (!supabaseAdmin) {
    return NextResponse.json(
      { ok: false, error: "Supabase server client not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { name, email, phone } = body;

    if (!name || !email) {
      return NextResponse.json(
        { ok: false, error: "Name and email are required" },
        { status: 400 }
      );
    }

    // 1️⃣ Auth user create (admin)
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
      });

    if (authError || !authUser?.user) {
      return NextResponse.json(
        {
          ok: false,
          error: authError?.message ?? "Failed to create auth user",
        },
        { status: 400 }
      );
    }

    const userId = authUser.user.id;

    // 2️⃣ public.users insert (role is REQUIRED)
    const { error: userError } = await supabaseAdmin
      .from("users")
      .insert([
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

    // 3️⃣ public.agents insert (tumhara original structure)
    const { data: agent, error: agentError } = await supabaseAdmin
      .from("agents")
      .insert([
        {
          user_id: userId,
          name,
          email,
          phone,
          billing_currency: "PKR", // default
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
