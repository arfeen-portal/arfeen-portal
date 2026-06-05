import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const fallbackData = {
  revenue: 0,
  cost: 0,
  commission: 0,
  estimated_profit: 0,
  pending_bookings: 0,
  confirmed_bookings: 0,
  negative_profit_bookings: 0,
  incomplete_pricing_bookings: 0,
  ai_recommendation: "No live AI decision data found yet. Start adding bookings, pricing and commission records."
};

export async function GET() {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json({
        ok: true,
        data: fallbackData,
        warning: "Supabase admin client is not configured."
      });
    }

    const { data, error } = await supabase
      .from("ai_decision_widget")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({
        ok: true,
        data: fallbackData,
        warning: error.message
      });
    }

    return NextResponse.json({
      ok: true,
      data: data ?? fallbackData
    });
  } catch (error) {
    return NextResponse.json({
      ok: true,
      data: fallbackData,
      warning: error instanceof Error ? error.message : "Unknown route error"
    });
  }
}