import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase admin client not configured." },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Missing auth token." },
      { status: 401 }
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user?.email) {
    return NextResponse.json(
      { ok: false, error: userError?.message || "Unauthorized." },
      { status: 401 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id,email,role,tenant_id")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  if (profileError) {
    return NextResponse.json(
      { ok: false, error: profileError.message },
      { status: 500 }
    );
  }

  if (!profile?.role) {
    return NextResponse.json(
      { ok: false, error: "User role not found in public.users." },
      { status: 403 }
    );
  }

  return NextResponse.json({
    ok: true,
    user: profile,
  });
}