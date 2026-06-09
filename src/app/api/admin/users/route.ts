import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const allowedRoles = [
  "super_admin",
  "admin",
  "accountant",
  "operations",
  "agent",
  "staff",
  "driver",
];

export async function GET() {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase admin client not configured." },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from("users")
      .select("id,email,role,is_suspended,last_login_at,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, users: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to fetch users.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase admin client not configured." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const id = String(body.id ?? "");

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "User id is required." },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (typeof body.role === "string") {
      if (!allowedRoles.includes(body.role)) {
        return NextResponse.json(
          { ok: false, error: "Invalid role." },
          { status: 400 }
        );
      }

      updates.role = body.role;
    }

    if (typeof body.is_suspended === "boolean") {
      updates.is_suspended = body.is_suspended;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { ok: false, error: "No valid updates provided." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select("id,email,role,is_suspended,last_login_at,created_at")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, user: data });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to update user.",
      },
      { status: 500 }
    );
  }
}