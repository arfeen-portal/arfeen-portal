"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";

type BookingStatus = "pending" | "confirmed" | "cancelled";

interface DashboardBookingRow {
  id: string;
  created_at: string;
  status: BookingStatus;
  passengers: number;
  package_code: string | null;
  package_origin: string | null;
  package_dates: string | null;
}

interface PackageSummaryRow {
  id: string;
  code: string | null;
  origin_city: string | null;
  date_range: string | null;
}

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminDashboardPage() {
  const [bookings, setBookings] = useState<DashboardBookingRow[]>([]);
  const [packages, setPackages] = useState<PackageSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // ✅ IMPORTANT: create client inside effect (not top-level)
        const supabase = createClient();
        if (!supabase) {
          setError(
            "Supabase is not configured. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel."
          );
          setLoading(false);
          return;
        }

        // BOOKINGS
        const { data: bookingRows, error: bookingError } = await supabase
          .from("umrah_bookings")
          .select(
            "id, created_at, status, passengers, umrah_packages:package_id ( code, origin_city, date_range )"
          )
          .order("created_at", { ascending: false })
          .limit(20);

        if (bookingError) throw bookingError;

        const mappedBookings: DashboardBookingRow[] =
          (bookingRows as any[])?.map((row: any) => {
            const pkg = row.umrah_packages;
            return {
              id: row.id,
              created_at: row.created_at,
              status: (row.status ?? "pending") as BookingStatus,
              passengers: row.passengers ?? 1,
              package_code: pkg?.code ?? null,
              package_origin: pkg?.origin_city ?? null,
              package_dates: pkg?.date_range ?? null,
            };
          }) ?? [];

        setBookings(mappedBookings);

        // PACKAGES
        const { data: packageRows, error: packageError } = await supabase
          .from("umrah_packages")
          .select("id, code, origin_city, date_range");

        if (packageError) throw packageError;

        const mappedPackages: PackageSummaryRow[] =
          (packageRows as any[])?.map((p: any) => ({
            id: p.id,
            code: p.code ?? null,
            origin_city: p.origin_city ?? null,
            date_range: p.date_range ?? null,
          })) ?? [];

        setPackages(mappedPackages);
      } catch (err: any) {
        console.error(err);
        setError("Failed to load dashboard data from Supabase.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const bookingStats = useMemo(() => {
    const total = bookings.length;
    let pending = 0;
    let confirmed = 0;
    let cancelled = 0;
    let passengers = 0;

    for (const b of bookings) {
      passengers += b.passengers || 0;
      if (b.status === "pending") pending++;
      if (b.status === "confirmed") confirmed++;
      if (b.status === "cancelled") cancelled++;
    }

    return { total, pending, confirmed, cancelled, passengers };
  }, [bookings]);

  const totalPackages = packages.length;

  const topPackages = useMemo(() => {
    const map = new Map<string, { code: string; count: number }>();
    for (const b of bookings) {
      if (!b.package_code) continue;
      const key = b.package_code;
      if (!map.has(key)) map.set(key, { code: key, count: 0 });
      map.get(key)!.count += 1;
    }
    const arr = Array.from(map.values());
    arr.sort((a, b) => b.count - a.count);
    return arr.slice(0, 5);
  }, [bookings]);

  return (
    <main className="min-h-screen bg-slate-100 pb-12">
      <div className="mx-auto max-w-6xl px-4 pt-8">
        {/* HEADER */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-xs md:text-sm text-slate-500">
              High-level overview of Umrah packages, bookings and recent
              activity.
            </p>
          </div>

          <div className="rounded-full bg-slate-900 px-4 py-2 text-[11px] font-semibold text-slate-100">
            Arfeen Travel &amp; Tours • Super Admin
          </div>
        </header>

        {/* STATS CARDS */}
        <section className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-2xl border bg-white px-4 py-3 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">
              Total Packages
            </div>
            <div className="mt-1 text-2xl font-bold text-slate-900">
              {totalPackages}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Umrah packages configured
            </div>
          </div>

          <div className="rounded-2xl border bg-white px-4 py-3 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">
              Bookings (Last 20)
            </div>
            <div className="mt-1 text-2xl font-bold text-slate-900">
              {bookingStats.total}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Passengers: {bookingStats.passengers}
            </div>
          </div>

          <div className="rounded-2xl border bg-white px-4 py-3 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">
              Pending
            </div>
            <div className="mt-1 text-2xl font-bold text-amber-700">
              {bookingStats.pending}
            </div>
          </div>

          <div className="rounded-2xl border bg-white px-4 py-3 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">
              Confirmed
            </div>
            <div className="mt-1 text-2xl font-bold text-emerald-700">
              {bookingStats.confirmed}
            </div>
          </div>
        </section>

        {/* QUICK LINKS */}
        <section className="mb-6 rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 mb-2">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link
              href="/umrah-packages"
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700 hover:border-slate-300"
            >
              View Packages (Public)
            </Link>
            <Link
              href="/umrah-packages/book"
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-semibold text-slate-700 hover:border-slate-300"
            >
              Booking Form (Public)
            </Link>
            <Link
              href="/admin/umrah-bookings"
              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700 hover:border-emerald-300"
            >
              Manage Bookings
            </Link>
            <Link
              href="/admin/agent-analytics"
              className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 font-semibold text-sky-700 hover:border-sky-300"
            >
              Agent Analytics
            </Link>
          </div>
        </section>

        {/* TOP PACKAGES */}
        <div className="rounded-2xl border bg-white p-4 shadow-sm mb-6">
          <h2 className="text-sm font-semibold text-slate-800 mb-2">
            Top Packages by Bookings (Last 20)
          </h2>
          {topPackages.length === 0 ? (
            <div className="text-xs text-slate-500">No booking data yet.</div>
          ) : (
            <ul className="space-y-1 text-xs">
              {topPackages.map((p) => (
                <li
                  key={p.code}
                  className="flex items-center justify-between border-b last:border-b-0 py-1"
                >
                  <span className="font-semibold text-slate-800">{p.code}</span>
                  <span className="text-[11px] text-slate-500">
                    {p.count} bookings
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* LATEST BOOKINGS TABLE */}
        <section className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">
              Latest bookings
            </h2>
            <Link
              href="/admin/umrah-bookings"
              className="text-[11px] font-semibold text-emerald-700 hover:underline"
            >
              View all
            </Link>
          </div>

          {error ? (
            <div className="p-6 text-xs text-red-600">{error}</div>
          ) : loading ? (
            <div className="p-6 text-xs text-slate-500">Loading dashboard data...</div>
          ) : bookings.length === 0 ? (
            <div className="p-6 text-xs text-slate-500">No bookings found yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs md:text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Package</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-right">Passengers</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr
                      key={b.id}
                      className="border-t border-slate-100 hover:bg-slate-50/60"
                    >
                      <td className="px-3 py-2 text-[11px] text-slate-500">
                        {formatDateTime(b.created_at)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-xs font-semibold text-slate-900">
                          {b.package_code ?? "(No Code)"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {(b.package_origin ?? "-") + " • " + (b.package_dates ?? "-")}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold " +
                            (b.status === "pending"
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : b.status === "confirmed"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-red-100 text-red-800 border-red-200")
                          }
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-slate-700">
                        {b.passengers}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
