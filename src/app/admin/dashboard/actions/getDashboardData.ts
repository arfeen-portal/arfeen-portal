"use server";

import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export async function getDashboardData() {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return {
      todayTransport: 0,
      todayPackages: 0,
      totalRevenue: 0,
      topRoutes: [],
      error: "Supabase admin client is not configured.",
    };
  }

  const today = new Date().toISOString().split("T")[0];

  const { count: todayTransport } = await supabase
    .from("transport_bookings")
    .select("*", { count: "exact", head: true })
    .gte("pickup_time", `${today}T00:00:00`)
    .lt("pickup_time", `${today}T23:59:59`);

  const { count: todayPackages } = await supabase
    .from("umrah_bookings")
    .select("*", { count: "exact", head: true })
    .eq("start_date", today);

  const { data: revenueData, error: revenueError } = await supabase
    .from("payments")
    .select("amount");

  const totalRevenue =
    !revenueError && Array.isArray(revenueData)
      ? revenueData.reduce(
          (sum, row: { amount: number | null }) => sum + Number(row.amount ?? 0),
          0
        )
      : 0;

  const topRoutes = [
    { route: "Jeddah → Makkah", count: 42 },
    { route: "Makkah → Madinah", count: 29 },
    { route: "Airport → Hotel", count: 21 },
  ];

  return {
    todayTransport: todayTransport ?? 0,
    todayPackages: todayPackages ?? 0,
    totalRevenue,
    topRoutes,
  };
}