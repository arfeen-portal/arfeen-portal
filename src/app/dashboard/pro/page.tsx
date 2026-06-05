"use client";

import { useEffect, useState } from "react";
import KpiCard from "@/components/dashboard/KpiCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import TopRoutesTable from "@/components/dashboard/TopRoutesTable";
import AnalyticsWidgets from "@/components/dashboard/AnalyticsWidgets";

export const dynamic = "force-dynamic";

type Kpis = {
  today_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  monthly_revenue: number;
  today_revenue: number;
};

type RevenueItem = {
  month_key: string;
  month_label: string;
  revenue: number;
  bookings: number;
};

type RouteItem = {
  route_name: string;
  total_bookings: number;
  total_revenue: number;
};

type RecentBooking = {
  id: string | number;
  customer_name: string | null;
  agent_name: string | null;
  pickup_city: string | null;
  dropoff_city: string | null;
  pickup_time: string | null;
  status: string | null;
  total_price: number | null;
};

export default function ProDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [revenue, setRevenue] = useState<RevenueItem[]>([]);
  const [topRoutes, setTopRoutes] = useState<RouteItem[]>([]);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [kpisRes, chartsRes, widgetsRes] = await Promise.all([
          fetch("/api/dashboard/kpis", { cache: "no-store" }),
          fetch("/api/dashboard/charts", { cache: "no-store" }),
          fetch("/api/dashboard/widgets", { cache: "no-store" }),
        ]);

        const [kpisJson, chartsJson, widgetsJson] = await Promise.all([
          kpisRes.json(),
          chartsRes.json(),
          widgetsRes.json(),
        ]);

        if (!active) return;

        if (!kpisJson.success) {
          throw new Error(kpisJson.error || "Failed to load KPI data");
        }

        if (!chartsJson.success) {
          throw new Error(chartsJson.error || "Failed to load chart data");
        }

        if (!widgetsJson.success) {
          throw new Error(widgetsJson.error || "Failed to load widget data");
        }

        setKpis(kpisJson.data ?? null);
        setRevenue(chartsJson.data?.revenue ?? []);
        setTopRoutes(chartsJson.data?.topRoutes ?? []);
        setRecentBookings(widgetsJson.data?.recentBookings ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Pro Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Executive overview, booking KPIs, charts, route analytics and recent
          activity.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          title="Today Bookings"
          value={loading ? "..." : kpis?.today_bookings ?? 0}
        />
        <KpiCard
          title="Pending"
          value={loading ? "..." : kpis?.pending_bookings ?? 0}
        />
        <KpiCard
          title="Confirmed"
          value={loading ? "..." : kpis?.confirmed_bookings ?? 0}
        />
        <KpiCard
          title="Monthly Revenue"
          value={
            loading
              ? "..."
              : `PKR ${Number(kpis?.monthly_revenue ?? 0).toLocaleString()}`
          }
        />
        <KpiCard
          title="Today Revenue"
          value={
            loading
              ? "..."
              : `PKR ${Number(kpis?.today_revenue ?? 0).toLocaleString()}`
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RevenueChart data={revenue} />
        <TopRoutesTable data={topRoutes} />
      </div>

      <AnalyticsWidgets recentBookings={recentBookings} />
    </div>
  );
}