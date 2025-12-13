import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdminSafe();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Supabase env not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();

    // ✅ Minimal safe create (aap apni exact fields yahan map kar do)
    const payload = {
      tenant_id: body?.tenant_id ?? null,
      family_name: body?.family_name ?? body?.name ?? "Family",
      created_at: new Date().toISOString(),
    };

    const { data, error } = await (supabaseAdmin as any)
      .from("families")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Failed to create family" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, family: data });
  } catch (e: any) {
    console.error("family create route error:", e);
    return NextResponse.json(
      { error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
