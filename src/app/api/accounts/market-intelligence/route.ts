import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json({
        ok: false,
        error: "Supabase admin client is not configured.",
        exchange: [],
        staff: [],
        emotions: [],
        accounting: [],
        demand: [],
      });
    }

    const [
      exchangeRes,
      staffRes,
      emotionsRes,
      accountingRes,
      demandRes,
    ] = await Promise.all([
      supabase.from("umrah_market_exchange_items").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("ai_staff_performance_truth").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("pilgrim_emotion_analytics").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("ai_self_healing_accounting_findings").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("global_umrah_demand_satellite").select("*").order("demand_score", { ascending: false }).limit(50),
    ]);

    return NextResponse.json({
      ok: true,
      exchange: exchangeRes.data ?? [],
      staff: staffRes.data ?? [],
      emotions: emotionsRes.data ?? [],
      accounting: accountingRes.data ?? [],
      demand: demandRes.data ?? [],
      errors: {
        exchange: exchangeRes.error?.message ?? null,
        staff: staffRes.error?.message ?? null,
        emotions: emotionsRes.error?.message ?? null,
        accounting: accountingRes.error?.message ?? null,
        demand: demandRes.error?.message ?? null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}