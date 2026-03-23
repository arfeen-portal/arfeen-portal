"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Car,
  Building2,
  Wallet,
  LineChart,
  Route,
  RefreshCw,
  Plus,
} from "lucide-react";

type RevenuePoint = {
  date: string;
  amount: number;
};

type TopRoute = {
  route: string;
  count: number;
};

type DashboardSummary = {
  todayBookings: number;
  transportBookings: number;
  hotelBookings: number;
  agentsLedger: number;
  revenueLast7Days: RevenuePoint[];
  topRoutes: TopRoute[];
};

const initialSummary: DashboardSummary = {
  todayBookings: 0,
  transportBookings: 0,
  hotelBookings: 0,
  agentsLedger: 0,
  revenueLast7Days: [],
  topRoutes: [],
};

const navItems: { label: string; href: string }[] = [
  { label: "Dashboard", href: "/" },
  { label: "Transport", href: "/transport" },
  { label: "Hotels", href: "/hotels" },
  { label: "Umrah Packages", href: "/umrah-packages" },
  { label: "Accounting", href: "/accounts" },
];

export default function HomePage() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary>(initialSummary);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/summary");
      if (!res.ok) {
        console.error("Failed to load dashboard summary", await res.text());
        return;
      }

      const data = (await res.json()) as Partial<DashboardSummary>;
      setSummary({
        ...initialSummary,
        ...data,
      });
    } catch (err) {
      console.error("Dashboard summary fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0f274d] text-lg font-bold text-white">
              AT
            </div>

            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-slate-400">
                Arfeen Travel
              </p>
              <p className="text-lg font-semibold text-white">
                Arfeen Travel Portal
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
            {navItems.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded-full border px-4 py-2 transition",
                    active
                      ? "border-[#0f274d] bg-[#0f274d] text-white"
                      : "border-slate-700 bg-transparent text-slate-300 hover:border-slate-500 hover:bg-slate-900",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={loadSummary}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            <Link
              href="/transport/new"
              className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              <Plus className="h-4 w-4" />
              New Booking
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <section className="mb-10 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-amber-300 md:text-sm">
            ARFEEN TRAVEL · PORTAL OVERVIEW
          </p>

          <h1 className="text-3xl font-semibold leading-tight md:text-5xl">
            Today&apos;s Overview
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-sm text-slate-300 md:text-xl">
            Track bookings, revenue, ledger exposure and top routes across the
            portal from one premium control center.
          </p>
        </section>

        <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Today&apos;s Bookings"
            value={summary.todayBookings.toString()}
            note="All modules combined"
            icon={<CalendarDays className="h-5 w-5 text-slate-400" />}
          />

          <SummaryCard
            title="Transport Bookings"
            value={summary.transportBookings.toString()}
            note="Airport + Intercity"
            icon={<Car className="h-5 w-5 text-slate-400" />}
          />

          <SummaryCard
            title="Hotel Bookings"
            value={summary.hotelBookings.toString()}
            note="Makkah + Madinah"
            icon={<Building2 className="h-5 w-5 text-slate-400" />}
          />

          <SummaryCard
            title="Net Receivable / Payable"
            value={`SAR ${summary.agentsLedger.toLocaleString("en-US")}`}
            note="Agents ledger balance"
            icon={<Wallet className="h-5 w-5 text-slate-400" />}
            valueClass="text-emerald-300"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Revenue (Last 7 Days)
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Daily revenue trend from confirmed booking activity.
                </p>
              </div>

              <span className="rounded-full bg-slate-800 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-300">
                Summary
              </span>
            </div>

            {summary.revenueLast7Days.length === 0 ? (
              <p className="mt-6 text-sm text-slate-400">
                No revenue data yet. Once bookings start, you&apos;ll see a 7-day
                trend here.
              </p>
            ) : (
              <div className="mt-6 space-y-3">
                {summary.revenueLast7Days.map((item) => (
                  <div
                    key={item.date}
                    className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3"
                  >
                    <span className="text-sm text-slate-300">{item.date}</span>
                    <span className="text-sm font-semibold text-emerald-300">
                      SAR {item.amount.toLocaleString("en-US")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <InfoCard
              title="Top Routes"
              badge="Transport"
              icon={<Route className="h-5 w-5 text-slate-400" />}
            >
              {summary.topRoutes.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No route data yet. Popular sectors like Jeddah → Makkah and
                  Makkah → Madinah will appear here.
                </p>
              ) : (
                <div className="space-y-3">
                  {summary.topRoutes.map((route) => (
                    <div
                      key={route.route}
                      className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3"
                    >
                      <span className="text-sm text-slate-300">{route.route}</span>
                      <span className="text-sm font-semibold text-amber-300">
                        {route.count} trips
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </InfoCard>

            <InfoCard
              title="Portal Notes"
              badge="Overview"
              icon={<LineChart className="h-5 w-5 text-slate-400" />}
            >
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-300">
                <li>Transport, hotels and accounts are now visually aligned.</li>
                <li>Dashboard is ready for premium white-label demos.</li>
                <li>Next layer can include charts, alerts and recent activity.</li>
              </ul>
            </InfoCard>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-sm text-slate-400 md:px-6 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Arfeen Travel. All rights reserved.</p>
          <p>
            Powered by <span className="font-semibold text-slate-300">Arfeen Travel Portal</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  note,
  icon,
  valueClass,
}: {
  title: string;
  value: string;
  note: string;
  icon: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
      <div className="flex items-start justify-between">
        <p className="text-xs uppercase tracking-wide text-slate-400">{title}</p>
        {icon}
      </div>
      <p className={`mt-5 text-4xl font-semibold text-white ${valueClass ?? ""}`}>
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-400">{note}</p>
    </div>
  );
}

function InfoCard({
  title,
  badge,
  icon,
  children,
}: {
  title: string;
  badge: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-xl font-semibold text-white">{title}</h2>
        </div>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-300">
          {badge}
        </span>
      </div>
      {children}
    </div>
  );
}