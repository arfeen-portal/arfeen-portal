"use client";

import { useEffect, useMemo, useState } from "react";

export const dynamic = "force-dynamic";

type CardData = {
  todayBookings: number;
  pendingToday: number;
  confirmedToday: number;
  revenueToday: number;
  totalAgents: number;
  activeAgents: number;
  revenue30d: number;
  pending30d: number;
  confirmed30d: number;
};

type TrendPoint = {
  date: string;
  bookings: number;
  revenue: number;
};

type TopRoute = {
  route: string;
  bookings: number;
  revenue: number;
};

type RecentBooking = {
  id: string;
  customer_name: string | null;
  agent_name: string | null;
  pickup_city: string | null;
  dropoff_city: string | null;
  vehicle_type: string | null;
  status: string | null;
  pickup_time: string | null;
  total_price: number | string | null;
};

type DashboardResponse = {
  ok: boolean;
  cards: CardData;
  trend14d: TrendPoint[];
  topRoutes: TopRoute[];
  recentBookings: RecentBooking[];
  generatedAt: string;
  today: string;
  error?: string;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(value);
}

function ChartBars({
  data,
  valueKey,
}: {
  data: TrendPoint[];
  valueKey: "bookings" | "revenue";
}) {
  const max = Math.max(...data.map((d) => Number(d[valueKey] || 0)), 1);

  return (
    <div className="flex h-56 items-end gap-2 rounded-2xl border border-slate-200 bg-white p-4">
      {data.map((item) => {
        const value = Number(item[valueKey] || 0);
        const h = Math.max((value / max) * 100, value > 0 ? 10 : 4);

        return (
          <div key={`${valueKey}-${item.date}`} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-full w-full items-end">
              <div
                className="w-full rounded-t-xl bg-slate-900 transition-all"
                style={{ height: `${h}%` }}
                title={`${item.date} - ${value}`}
              />
            </div>
            <span className="text-[10px] text-slate-500">
              {item.date.slice(5)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function ProDashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/dashboard/pro", {
        cache: "no-store",
      });

      const json: DashboardResponse = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to load dashboard.");
      }

      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const summaryCards = useMemo(() => {
    if (!data) return [];
    return [
      {
        title: "Today Bookings",
        value: data.cards.todayBookings,
        sub: `Pending ${data.cards.pendingToday} • Confirmed ${data.cards.confirmedToday}`,
      },
      {
        title: "Revenue Today",
        value: `PKR ${formatMoney(data.cards.revenueToday)}`,
        sub: "Today’s transport revenue",
      },
      {
        title: "30D Revenue",
        value: `PKR ${formatMoney(data.cards.revenue30d)}`,
        sub: `Pending ${data.cards.pending30d} • Confirmed ${data.cards.confirmed30d}`,
      },
      {
        title: "Active Agents",
        value: data.cards.activeAgents,
        sub: `Total agents ${data.cards.totalAgents}`,
      },
    ];
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Pro Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Cards, graphs, route analytics, recent bookings aur live business snapshot.
            </p>
          </div>

          <button
            onClick={loadDashboard}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-3xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error}
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="text-sm font-medium text-slate-500">
                    {card.title}
                  </div>
                  <div className="mt-3 text-3xl font-bold text-slate-900">
                    {card.value}
                  </div>
                  <div className="mt-2 text-sm text-slate-600">{card.sub}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Bookings Trend
                    </h2>
                    <p className="text-sm text-slate-500">
                      Last 14 days booking count
                    </p>
                  </div>
                </div>
                <ChartBars data={data.trend14d} valueKey="bookings" />
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Revenue Trend
                    </h2>
                    <p className="text-sm text-slate-500">
                      Last 14 days revenue movement
                    </p>
                  </div>
                </div>
                <ChartBars data={data.trend14d} valueKey="revenue" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
              <div className="xl:col-span-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Top Routes
                  </h2>
                  <p className="text-sm text-slate-500">
                    Most booked routes in last 30 days
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-500">
                        <th className="px-3 py-3 font-medium">Route</th>
                        <th className="px-3 py-3 font-medium">Bookings</th>
                        <th className="px-3 py-3 font-medium">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topRoutes.map((route) => (
                        <tr key={route.route} className="border-b border-slate-100">
                          <td className="px-3 py-3 font-medium text-slate-900">
                            {route.route}
                          </td>
                          <td className="px-3 py-3 text-slate-700">
                            {route.bookings}
                          </td>
                          <td className="px-3 py-3 text-slate-700">
                            PKR {formatMoney(route.revenue)}
                          </td>
                        </tr>
                      ))}
                      {data.topRoutes.length === 0 && (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-3 py-6 text-center text-slate-500"
                          >
                            No route analytics found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Recent Bookings
                  </h2>
                  <p className="text-sm text-slate-500">
                    Latest transport activity
                  </p>
                </div>

                <div className="space-y-3">
                  {data.recentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-900">
                            {booking.customer_name || "Unnamed Customer"}
                          </div>
                          <div className="mt-1 text-sm text-slate-600">
                            {booking.pickup_city || "N/A"} → {booking.dropoff_city || "N/A"}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {booking.agent_name || "No agent"} • {booking.vehicle_type || "Vehicle N/A"}
                          </div>
                        </div>

                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-700">
                          {booking.status || "unknown"}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                        <span>
                          {booking.pickup_time
                            ? new Date(booking.pickup_time).toLocaleString()
                            : "No time"}
                        </span>
                        <span className="font-medium text-slate-700">
                          PKR {formatMoney(Number(booking.total_price || 0))}
                        </span>
                      </div>
                    </div>
                  ))}

                  {data.recentBookings.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                      No recent bookings found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}