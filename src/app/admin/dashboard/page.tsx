"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BrainCircuit,
  Bus,
  Car,
  Flame,
  Globe2,
  Receipt,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TrendPoint = {
  name: string;
  revenue: number;
  profit: number;
  bookings: number;
};

type TopRoute = {
  route: string;
  amount: number;
  bookings: number;
};

type RecentBooking = {
  id: string;
  customer_name: string | null;
  agent_name: string | null;
  pickup_city: string | null;
  dropoff_city: string | null;
  vehicle_type: string | null;
  pickup_time: string | null;
  total_price: number | null;
  status: string | null;
};

type DashboardData = {
  success: boolean;
  stats: {
    totalRevenue: number;
    currentRevenue: number;
    totalBookings: number;
    currentBookings: number;
    activeAgents: number;
    revenueChange: number;
    bookingsChange: number;
  } | null;
  ai: {
    activeProfitLeaks: number;
    recoveryAtRisk: number;
    priorityAction: string;
  } | null;
  revenueTrend: TrendPoint[];
  topRoutes: TopRoute[];
  recentBookings: RecentBooking[];
  error?: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatMoney(value: number) {
  return `PKR ${Math.round(Number(value || 0)).toLocaleString("en-PK")}`;
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString("en-PK");
}

function compact(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[28px] bg-slate-200/80",
        className
      )}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-4 sm:p-6">
      <SkeletonBox className="h-52 w-full rounded-[34px]" />

      <section className="grid gap-6 lg:grid-cols-3">
        <SkeletonBox className="h-56 lg:col-span-2" />
        <SkeletonBox className="h-56" />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SkeletonBox className="h-40" />
        <SkeletonBox className="h-40" />
        <SkeletonBox className="h-40" />
        <SkeletonBox className="h-40" />
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <SkeletonBox className="h-[420px] xl:col-span-8" />
        <SkeletonBox className="h-[420px] xl:col-span-4" />
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <SkeletonBox className="h-[420px] xl:col-span-8" />
        <SkeletonBox className="h-[420px] xl:col-span-4" />
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtext,
  trend,
  icon: Icon,
}: {
  title: string;
  value: string;
  subtext: string;
  trend: number;
  icon: React.ElementType;
}) {
  const isUp = trend >= 0;

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Icon className="h-6 w-6" />
        </div>

        <div
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black",
            isUp ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          )}
        >
          {isUp ? (
            <ArrowUpRight className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownRight className="h-3.5 w-3.5" />
          )}
          {trend.toFixed(1)}%
        </div>
      </div>

      <p className="mt-5 text-sm font-semibold text-slate-500">{title}</p>
      <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
        {value}
      </h3>
      <p className="mt-2 text-sm leading-5 text-slate-500">{subtext}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-medium text-slate-500">
      {text}
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const clean = status || "pending";

  return (
    <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black uppercase text-slate-700 shadow-sm">
      {clean}
    </span>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function loadDashboard() {
      try {
        const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
        const json = (await res.json()) as DashboardData;

        if (alive) setData(json);
      } catch {
        if (alive) {
          setData({
            success: false,
            stats: null,
            ai: null,
            revenueTrend: [],
            topRoutes: [],
            recentBookings: [],
            error: "Unable to load dashboard",
          });
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      alive = false;
    };
  }, []);

  const stats = data?.stats ?? {
    totalRevenue: 0,
    currentRevenue: 0,
    totalBookings: 0,
    currentBookings: 0,
    activeAgents: 0,
    revenueChange: 0,
    bookingsChange: 0,
  };

  const ai = data?.ai ?? {
    activeProfitLeaks: 0,
    recoveryAtRisk: 0,
    priorityAction: "Normal",
  };

  const revenueTrend = data?.revenueTrend ?? [];
  const topRoutes = data?.topRoutes ?? [];
  const recentBookings = data?.recentBookings ?? [];

  const healthScore = useMemo(() => {
    let score = 94;

    if (ai.activeProfitLeaks >= 10) score -= 18;
    else if (ai.activeProfitLeaks >= 4) score -= 10;

    if (ai.recoveryAtRisk >= 1_000_000) score -= 14;
    else if (ai.recoveryAtRisk >= 500_000) score -= 8;

    if (stats.revenueChange < 0) score -= 8;
    if (stats.bookingsChange < 0) score -= 6;

    return Math.max(45, Math.min(99, score));
  }, [ai.activeProfitLeaks, ai.recoveryAtRisk, stats.revenueChange, stats.bookingsChange]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-4 sm:p-6">
      {data && !data.success ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          Dashboard data could not be fully loaded. Showing safe fallback values.
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[34px] border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-5 text-white shadow-2xl sm:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black text-slate-200">
              <Globe2 className="h-4 w-4" />
              Arfeen Travel AI Command Center
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Admin Dashboard
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Live command view for revenue, bookings, active agents, top routes,
              transport operations, profit leak risk, and AI recovery priorities.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:w-[520px]">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                System Health
              </p>
              <p className="mt-2 text-3xl font-black">{healthScore}%</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                AI Priority
              </p>
              <p className="mt-2 text-3xl font-black">{ai.priorityAction}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Active Agents
              </p>
              <p className="mt-2 text-3xl font-black">
                {formatNumber(stats.activeAgents)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[32px] bg-slate-950 p-5 text-white shadow-xl sm:p-6 lg:col-span-2">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-red-500" />
              <h2 className="text-xl font-black">
                AI Profit Leak & Risk Center
              </h2>
            </div>

            <Link
              href="/accounts/profit-leaks"
              className="w-fit rounded-xl bg-white px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-slate-100"
            >
              Analyze Leaks →
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                Active Profit Leaks
              </p>
              <p className="mt-2 text-4xl font-black text-red-400">
                {formatNumber(ai.activeProfitLeaks)}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Open cases requiring finance action.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                Recovery At Risk
              </p>
              <p className="mt-2 text-3xl font-black text-amber-400">
                {formatMoney(ai.recoveryAtRisk)}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Estimated open leakage exposure.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                Next Best Action
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-200">
                Review open leaks, freeze risky commissions, and escalate overdue
                recovery cases.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-indigo-600" />
            <h3 className="font-black text-slate-900">AI Operations Alerts</h3>
          </div>

          <div className="mt-5 space-y-3">
            {[
              "Review high-risk agent balances",
              "Check unassigned transport bookings",
              "Audit current month profit margin",
            ].map((item) => (
              <div
                key={item}
                className="flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-semibold leading-5 text-slate-700"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatMoney(stats.totalRevenue)}
          subtext="All transport booking revenue"
          icon={Banknote}
          trend={stats.revenueChange}
        />

        <StatCard
          title="This Month Revenue"
          value={formatMoney(stats.currentRevenue)}
          subtext={`${formatNumber(stats.currentBookings)} bookings this month`}
          icon={TrendingUp}
          trend={stats.revenueChange}
        />

        <StatCard
          title="Total Bookings"
          value={formatNumber(stats.totalBookings)}
          subtext="Total transport booking records"
          icon={Receipt}
          trend={stats.bookingsChange}
        />

        <StatCard
          title="Active Agents"
          value={formatNumber(stats.activeAgents)}
          subtext="Currently active agents in system"
          icon={Users}
          trend={0}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm xl:col-span-8">
          <div className="mb-5">
            <h2 className="text-lg font-black text-slate-900">
              Revenue & Profit Trend
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Last 6 months commercial movement
            </p>
          </div>

          {revenueTrend.length ? (
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis
                    tickFormatter={(value) => compact(Number(value))}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => formatMoney(value)}
                    contentStyle={{
                      borderRadius: 16,
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    strokeWidth={3}
                    fillOpacity={0.18}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    strokeWidth={2.5}
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState text="No revenue trend data found yet." />
          )}
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm xl:col-span-4">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-900">Top Routes</h2>
              <p className="mt-1 text-sm text-slate-500">
                Highest revenue travel routes
              </p>
            </div>

            <Link
              href="/admin/reports/travel"
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
            >
              Report
            </Link>
          </div>

          <div className="space-y-3">
            {topRoutes.length ? (
              topRoutes.map((item, index) => (
                <div
                  key={item.route}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-black text-slate-900">
                      {index + 1}. {item.route}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {formatNumber(item.bookings)} bookings
                    </p>
                  </div>

                  <p className="shrink-0 text-right text-sm font-black text-slate-900">
                    {formatMoney(item.amount)}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState text="No top route data found yet." />
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm xl:col-span-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">
                Recent Bookings
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest transport activity from live database
              </p>
            </div>

            <Link
              href="/transport"
              className="w-fit rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
            >
              View All
            </Link>
          </div>

          {recentBookings.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                <thead>
                  <tr className="text-left text-xs font-black uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">Customer</th>
                    <th className="px-3 py-2">Agent</th>
                    <th className="px-3 py-2">Route</th>
                    <th className="px-3 py-2">Vehicle</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="bg-slate-50">
                      <td className="rounded-l-2xl px-3 py-3 font-black text-slate-900">
                        {booking.customer_name ?? "-"}
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-700">
                        {booking.agent_name ?? "-"}
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-700">
                        {booking.pickup_city ?? "-"} →{" "}
                        {booking.dropoff_city ?? "-"}
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-700">
                        {booking.vehicle_type ?? "-"}
                      </td>
                      <td className="px-3 py-3 font-black text-slate-900">
                        {formatMoney(Number(booking.total_price ?? 0))}
                      </td>
                      <td className="rounded-r-2xl px-3 py-3">
                        <StatusBadge status={booking.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState text="No recent bookings found yet." />
          )}
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm xl:col-span-4">
          <h2 className="text-lg font-black text-slate-900">Quick Actions</h2>
          <p className="mt-1 text-sm text-slate-500">
            Fast admin shortcuts for daily work
          </p>

          <div className="mt-5 space-y-3">
            {[
              { title: "New Transport Booking", href: "/transport/new", icon: Car },
              { title: "Create Invoice", href: "/accounts/invoices/new", icon: Receipt },
              { title: "Agent Ledger", href: "/accounts/agent-ledger", icon: Users },
              { title: "Operations Live Control", href: "/oprations/live-control", icon: Bus },
              {
                title: "AI Financial Health",
                href: "/accounts/ai-financial-health",
                icon: BrainCircuit,
              },
              { title: "Profit Leaks", href: "/accounts/profit-leaks", icon: Flame },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 group-hover:bg-white">
                    <Icon className="h-5 w-5" />
                  </div>

                  <span className="font-black text-slate-800">{item.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-black text-slate-900">Booking Volume</h2>
          <p className="mt-1 text-sm text-slate-500">
            Monthly booking count trend
          </p>
        </div>

        {revenueTrend.length ? (
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueTrend}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value: number) => formatNumber(value)}
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                  }}
                />
                <Bar dataKey="bookings" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState text="No booking volume data found yet." />
        )}
      </section>
    </div>
  );
}