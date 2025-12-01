"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Car, Building2, Wallet } from "lucide-react";

// ---- Types ----
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
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary>(initialSummary);
  const pathname = usePathname();

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
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* -------- TOP BAR -------- */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Left - Logo + text */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#0A2342] flex items-center justify-center">
              <span className="text-white font-semibold text-lg">AT</span>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                ARFEEN TRAVEL
              </p>
              <p className="text-sm font-semibold text-slate-900">
                Arfeen Travel Portal
              </p>
            </div>
          </div>

          {/* Center - Nav (tabs) */}
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
                    "rounded-full px-3 py-1 transition border",
                    active
                      ? "bg-[#0A2342] text-white border-[#0A2342]"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right - Buttons */}
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={loadSummary}
              disabled={loading}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>

            <button className="rounded-full bg-[#0A2342] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#C59D32] hover:text-slate-900 transition">
              New Booking
            </button>
          </div>
        </div>
      </header>

      {/* -------- CONTENT -------- */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Heading */}
          <div className="mb-6 flex flex-col gap-1">
            <h1 className="text-2xl font-semibold text-slate-900">
              Today&apos;s Overview
            </h1>
            <p className="text-sm text-slate-500">
              Bookings, revenue and top routes across all modules.
            </p>
          </div>

          {/* Top stats grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Today bookings */}
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Today&apos;s Bookings
                </p>
                <CalendarDays className="w-4 h-4 text-slate-400" />
              </div>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {summary.todayBookings}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                All modules combined
              </p>
            </div>

            {/* Transport */}
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Transport Bookings
                </p>
                <Car className="w-4 h-4 text-slate-400" />
              </div>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {summary.transportBookings}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Airport + Intercity
              </p>
            </div>

            {/* Hotel */}
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Hotel Bookings
                </p>
                <Building2 className="w-4 h-4 text-slate-400" />
              </div>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {summary.hotelBookings}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Makkah + Madinah
              </p>
            </div>

            {/* Ledger */}
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Net Receivable / Payable
                </p>
                <Wallet className="w-4 h-4 text-slate-400" />
              </div>
              <p className="mt-3 text-2xl font-semibold text-slate-900">
                SAR {summary.agentsLedger.toLocaleString("en-US")}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Agents ledger balance
              </p>
            </div>
          </div>

          {/* Bottom grid */}
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {/* Revenue card */}
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  Revenue (Last 7 Days)
                </h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  Summary
                </span>
              </div>

              {summary.revenueLast7Days.length === 0 ? (
                <p className="mt-6 text-xs text-slate-500">
                  No revenue data yet. Once bookings start, you&apos;ll see a
                  7-day trend here.
                </p>
              ) : (
                <ul className="mt-4 space-y-1 text-xs text-slate-600">
                  {summary.revenueLast7Days.map((item) => (
                    <li
                      key={item.date}
                      className="flex items-center justify-between"
                    >
                      <span>{item.date}</span>
                      <span className="font-medium">
                        SAR {item.amount.toLocaleString("en-US")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Top routes card */}
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  Top Routes
                </h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  Transport
                </span>
              </div>

              {summary.topRoutes.length === 0 ? (
                <p className="mt-6 text-xs text-slate-500">
                  No route data yet. Popular sectors like Jeddah → Makkah and
                  Makkah → Madinah will appear here.
                </p>
              ) : (
                <ul className="mt-4 space-y-1 text-xs text-slate-600">
                  {summary.topRoutes.map((route) => (
                    <li
                      key={route.route}
                      className="flex items-center justify-between"
                    >
                      <span>{route.route}</span>
                      <span className="font-medium">{route.count} trips</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* -------- FOOTER -------- */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Arfeen Travel. All rights reserved.
          </p>
          <p className="text-xs text-slate-400">
            Powered by <span className="font-semibold text-slate-600">Arfeen Travel Portal</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
