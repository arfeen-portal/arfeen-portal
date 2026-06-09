import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getMonthRange(offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
    label: start.toLocaleString("en", { month: "short", year: "numeric" }),
  };
}

function calcChange(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export async function GET() {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          stats: null,
          ai: null,
          revenueTrend: [],
          topRoutes: [],
          recentBookings: [],
          error: "Supabase admin client not configured",
        },
        { status: 500 }
      );
    }

    const currentMonth = getMonthRange(0);
    const previousMonth = getMonthRange(1);

    const [
      currentBookingsRes,
      previousBookingsRes,
      allBookingsRes,
      recentBookingsRes,
      agentsRes,
      profitLeaksRes,
    ] = await Promise.all([
      supabase
        .from("transport_bookings")
        .select("id,total_price,created_at", { count: "exact" })
        .gte("created_at", currentMonth.start)
        .lt("created_at", currentMonth.end),

      supabase
        .from("transport_bookings")
        .select("id,total_price,created_at", { count: "exact" })
        .gte("created_at", previousMonth.start)
        .lt("created_at", previousMonth.end),

      supabase
        .from("transport_bookings")
        .select("id,total_price,created_at,pickup_city,dropoff_city,status"),

      supabase
        .from("transport_bookings")
        .select(
          "id,customer_name,agent_name,pickup_city,dropoff_city,vehicle_type,pickup_time,total_price,status,created_at"
        )
        .order("created_at", { ascending: false })
        .limit(8),

      supabase
        .from("agents")
        .select("id", { count: "exact" })
        .eq("is_active", true),

      supabase
        .from("profit_leaks")
        .select("id,amount,status,severity,created_at", { count: "exact" })
        .eq("status", "open"),
    ]);

    const allRows = allBookingsRes.data ?? [];
    const currentRows = currentBookingsRes.data ?? [];
    const previousRows = previousBookingsRes.data ?? [];
    const recentBookings = recentBookingsRes.data ?? [];

    const currentRevenue = currentRows.reduce(
      (sum, row) => sum + Number(row.total_price ?? 0),
      0
    );

    const previousRevenue = previousRows.reduce(
      (sum, row) => sum + Number(row.total_price ?? 0),
      0
    );

    const totalRevenue = allRows.reduce(
      (sum, row) => sum + Number(row.total_price ?? 0),
      0
    );

    const revenueTrend = Array.from({ length: 6 })
      .map((_, i) => getMonthRange(5 - i))
      .map((month) => {
        const rows = allRows.filter(
          (row) =>
            row.created_at &&
            row.created_at >= month.start &&
            row.created_at < month.end
        );

        const revenue = rows.reduce(
          (sum, row) => sum + Number(row.total_price ?? 0),
          0
        );

        return {
          name: month.label,
          revenue,
          profit: Math.round(revenue * 0.16),
          bookings: rows.length,
        };
      });

    const routeMap = new Map<string, { amount: number; bookings: number }>();

    for (const row of allRows) {
      const route = `${row.pickup_city ?? "Unknown"} → ${
        row.dropoff_city ?? "Unknown"
      }`;

      const current = routeMap.get(route) ?? { amount: 0, bookings: 0 };
      current.amount += Number(row.total_price ?? 0);
      current.bookings += 1;

      routeMap.set(route, current);
    }

    const topRoutes = Array.from(routeMap.entries())
      .map(([route, value]) => ({
        route,
        amount: value.amount,
        bookings: value.bookings,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    const openLeaks = profitLeaksRes.error ? [] : profitLeaksRes.data ?? [];
    const recoveryAtRisk = openLeaks.reduce(
      (sum, row) => sum + Number(row.amount ?? 0),
      0
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue,
        currentRevenue,
        totalBookings: allRows.length,
        currentBookings: currentBookingsRes.count ?? 0,
        activeAgents: agentsRes.count ?? 0,
        revenueChange: calcChange(currentRevenue, previousRevenue),
        bookingsChange: calcChange(
          currentBookingsRes.count ?? 0,
          previousBookingsRes.count ?? 0
        ),
      },
      ai: {
        activeProfitLeaks: openLeaks.length,
        recoveryAtRisk,
        priorityAction:
          openLeaks.length >= 10
            ? "Critical"
            : openLeaks.length >= 4
            ? "High"
            : "Normal",
      },
      revenueTrend,
      topRoutes,
      recentBookings,
    });
  } catch (error) {
    console.error("Admin dashboard API error:", error);

    return NextResponse.json(
      {
        success: false,
        stats: null,
        ai: null,
        revenueTrend: [],
        topRoutes: [],
        recentBookings: [],
        error: "Dashboard API failed",
      },
      { status: 500 }
    );
  }
}