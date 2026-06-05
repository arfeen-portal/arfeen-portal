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

    const [{ data: revenue, error: revenueError }, { data: routes, error: routesError }] =
      await Promise.all([
        supabaseAdmin
          .from("v_dashboard_monthly_revenue")
          .select("*")
          .order("month_key", { ascending: true }),
        supabaseAdmin
          .from("v_dashboard_top_routes")
          .select("*")
          .limit(10),
      ]);

    if (revenueError || routesError) {
      return NextResponse.json(
        {
          success: false,
          error: revenueError?.message || routesError?.message || "Failed to load charts",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        revenue: revenue ?? [],
        topRoutes: routes ?? [],
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}