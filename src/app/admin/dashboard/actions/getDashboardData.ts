"use server";

import { createClient } from "@/lib/supabaseServer";

export async function getDashboardData() {
  const supabase = createClient();

  const today = new Date().toISOString().split("T")[0];

  const { count: todayTransport = 0 } = await supabase
    .from("transport_bookings")
    .select("*", { count: "exact", head: true })
    .eq("date", today);

  const { count: todayPackages = 0 } = await supabase
    .from("umrah_bookings")
    .select("*", { count: "exact", head: true })
    .eq("start_date", today);

  const { data: revenueData, error: revenueError } = await supabase
    .from("payments")
    .select("amount");

  const totalRevenue =
    !revenueError && revenueData
      ? revenueData.reduce(
          (sum, row: { amount: number | null }) => sum + (row.amount ?? 0),
          0
        )
      : 0;

  const topRoutes = [
    { route: "Jeddah → Makkah", count: 42 },
    { route: "Makkah → Madinah", count: 29 },
    { route: "Airport → Hotel", count: 21 },
  ];

  return {
    todayTransport,
    todayPackages,
    totalRevenue,
    topRoutes,
  };
}