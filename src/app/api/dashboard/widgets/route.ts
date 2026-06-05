import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: "Supabase admin client is not configured." },
        { status: 500 }
      );
    }

    const [{ data: widgets, error: widgetsError }, { data: recent, error: recentError }] =
      await Promise.all([
        supabaseAdmin
          .from("dashboard_widgets")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabaseAdmin
          .from("v_dashboard_recent_bookings")
          .select("*")
          .limit(10),
      ]);

    if (widgetsError) {
      return NextResponse.json(
        { success: false, error: widgetsError.message },
        { status: 500 }
      );
    }

    if (recentError) {
      return NextResponse.json(
        { success: false, error: recentError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        widgets: widgets ?? [],
        recentBookings: recent ?? [],
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}