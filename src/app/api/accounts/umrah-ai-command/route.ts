// src/app/api/accounts/umrah-ai-command/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
      .from("umrah_ai_command_signals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const rows = data ?? [];

    const summary = {
      totalSignals: rows.length,
      critical: rows.filter((x) => x.severity === "critical").length,
      high: rows.filter((x) => x.severity === "high").length,
      avgAiScore:
        rows.length > 0
          ? Math.round(
              rows.reduce((sum, x) => sum + Number(x.ai_score || 0), 0) /
                rows.length
            )
          : 0,
    };

    return NextResponse.json({ ok: true, summary, signals: rows });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}