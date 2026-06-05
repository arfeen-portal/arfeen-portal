import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type BookingRow = {
  id: string;
  customer_name: string | null;
  agent_name: string | null;
  pickup_city: string | null;
  dropoff_city: string | null;
  vehicle_type: string | null;
  status: string | null;
  pickup_time: string | null;
  total_price: number | string | null;
  created_at?: string | null;
};

function dateKey(value: string | null | undefined) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase admin client is not available." },
        { status: 500 }
      );
    }

    const now = new Date();
    const todayIso = now.toISOString().slice(0, 10);
    const last30 = new Date();
    last30.setDate(last30.getDate() - 29);

    const last14 = new Date();
    last14.setDate(last14.getDate() - 13);

    const last30Iso = last30.toISOString();
    const last14Iso = last14.toISOString();

    const [
      cardsTodayRes,
      agentsSummaryRes,
      bookings30Res,
      recentBookingsRes,
    ] = await Promise.all([
      supabase.from("v_dashboard_cards_today").select("*").maybeSingle(),
      supabase.from("v_dashboard_agents_summary").select("*").maybeSingle(),
      supabase
        .from("transport_bookings")
        .select(
          "id, customer_name, agent_name, pickup_city, dropoff_city, vehicle_type, status, pickup_time, total_price, created_at"
        )
        .gte("pickup_time", last30Iso)
        .order("pickup_time", { ascending: true }),
      supabase
        .from("transport_bookings")
        .select(
          "id, customer_name, agent_name, pickup_city, dropoff_city, vehicle_type, status, pickup_time, total_price, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    if (cardsTodayRes.error) throw cardsTodayRes.error;
    if (agentsSummaryRes.error) throw agentsSummaryRes.error;
    if (bookings30Res.error) throw bookings30Res.error;
    if (recentBookingsRes.error) throw recentBookingsRes.error;

    const bookings30 = (bookings30Res.data || []) as BookingRow[];
    const recentBookings = (recentBookingsRes.data || []) as BookingRow[];

    const bookingsByDayMap = new Map<
      string,
      { date: string; bookings: number; revenue: number }
    >();

    for (let i = 0; i < 14; i++) {
      const d = new Date(last14);
      d.setDate(last14.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      bookingsByDayMap.set(key, { date: key, bookings: 0, revenue: 0 });
    }

    const topRoutesMap = new Map<
      string,
      { route: string; bookings: number; revenue: number }
    >();

    let revenue30d = 0;
    let pending30d = 0;
    let confirmed30d = 0;

    for (const row of bookings30) {
      const total = Number(row.total_price || 0);
      revenue30d += total;

      const status = String(row.status || "").toLowerCase();
      if (status === "pending") pending30d += 1;
      if (status === "confirmed") confirmed30d += 1;

      const key = dateKey(row.pickup_time);
      if (bookingsByDayMap.has(key)) {
        const current = bookingsByDayMap.get(key)!;
        current.bookings += 1;
        current.revenue += total;
      }

      const routeLabel = `${row.pickup_city || "N/A"} → ${row.dropoff_city || "N/A"}`;
      const existing = topRoutesMap.get(routeLabel) || {
        route: routeLabel,
        bookings: 0,
        revenue: 0,
      };
      existing.bookings += 1;
      existing.revenue += total;
      topRoutesMap.set(routeLabel, existing);
    }

    const trend14d = Array.from(bookingsByDayMap.values());

    const topRoutes = Array.from(topRoutesMap.values())
      .sort((a, b) => {
        if (b.bookings !== a.bookings) return b.bookings - a.bookings;
        return b.revenue - a.revenue;
      })
      .slice(0, 6);

    const payload = {
      ok: true,
      cards: {
        todayBookings: Number(cardsTodayRes.data?.today_bookings || 0),
        pendingToday: Number(cardsTodayRes.data?.pending_today || 0),
        confirmedToday: Number(cardsTodayRes.data?.confirmed_today || 0),
        revenueToday: Number(cardsTodayRes.data?.revenue_today || 0),
        totalAgents: Number(agentsSummaryRes.data?.total_agents || 0),
        activeAgents: Number(agentsSummaryRes.data?.active_agents || 0),
        revenue30d,
        pending30d,
        confirmed30d,
      },
      trend14d,
      topRoutes,
      recentBookings,
      generatedAt: new Date().toISOString(),
      today: todayIso,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("GET /api/dashboard/pro error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 }
    );
  }
}