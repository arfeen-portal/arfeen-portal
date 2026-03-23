"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Booking = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  agent_name: string | null;
  agent_code: string | null;
  pickup_city: string;
  dropoff_city: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  vehicle_type: string;
  passengers: number;
  status: string;
  total_price: number | null;
};

function formatCurrency(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function normalizeStatusLabel(status: string) {
  if (!status) return "Pending";
  return status
    .replace("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusClasses(status: string) {
  const s = status?.toLowerCase() || "";

  if (s === "completed") {
    return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30";
  }
  if (s === "confirmed") {
    return "bg-sky-500/15 text-sky-300 border border-sky-500/30";
  }
  if (s === "assigned") {
    return "bg-violet-500/15 text-violet-300 border border-violet-500/30";
  }
  if (s === "in-progress") {
    return "bg-amber-500/15 text-amber-300 border border-amber-500/30";
  }
  if (s === "cancelled") {
    return "bg-red-500/15 text-red-300 border border-red-500/30";
  }

  return "bg-slate-500/15 text-slate-300 border border-slate-500/30";
}

export default function TransportListPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function fetchBookings() {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const url = params.toString()
        ? `/api/transport/list?${params.toString()}`
        : `/api/transport/list`;

      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json();
      setBookings(data?.bookings ?? []);
    } catch (error) {
      console.error(error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch("/api/transport/update-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ booking_id: id, status }),
    });

    if (!res.ok) return;
    await fetchBookings();
  }

  async function deleteBooking(id: string) {
    const ok = window.confirm("Delete this booking?");
    if (!ok) return;

    const res = await fetch(`/api/transport/bookings/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) return;
    await fetchBookings();
  }

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;

    return bookings.filter((b) => {
      return [
        b.customer_name,
        b.customer_phone,
        b.agent_name,
        b.agent_code,
        b.pickup_city,
        b.dropoff_city,
        b.pickup_location,
        b.dropoff_location,
        b.vehicle_type,
        b.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [bookings, search]);

  const stats = useMemo(() => {
    const totalBookings = bookings.length;
    const pendingCount = bookings.filter((b) => b.status === "pending").length;
    const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
    const completedCount = bookings.filter((b) => b.status === "completed").length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_price ?? 0), 0);

    return {
      totalBookings,
      pendingCount,
      confirmedCount,
      completedCount,
      totalRevenue,
    };
  }, [bookings]);

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-12">
        <section className="mb-10 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-amber-300 md:text-sm">
            ARFEEN TRAVEL · PREMIUM TRANSPORT
          </p>

          <h1 className="text-3xl font-semibold leading-tight md:text-5xl">
            Book Premium Transport in Saudi Arabia
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-sm text-slate-300 md:text-xl">
            Airport transfers, ziyarat routes and intercity rides with a clean
            booking workflow for agents, families, VIP guests and Umrah groups.
          </p>
        </section>

        <section className="mb-8 grid gap-6 lg:grid-cols-[1.6fr,1fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl md:p-7">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold md:text-lg">
                Transport Bookings
              </h2>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] uppercase tracking-wide text-emerald-300 md:text-xs">
                Live Dashboard
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Total Bookings
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">
                  {stats.totalBookings}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Pending
                </p>
                <p className="mt-3 text-3xl font-semibold text-amber-300">
                  {stats.pendingCount}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Confirmed
                </p>
                <p className="mt-3 text-3xl font-semibold text-sky-300">
                  {stats.confirmedCount}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400">
                  Revenue
                </p>
                <p className="mt-3 text-3xl font-semibold text-emerald-300">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Search bookings
                </label>
                <input
                  type="text"
                  placeholder="Customer, phone, route, vehicle..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-300"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Status
                </label>
                <select
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-300"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="assigned">Assigned</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={fetchBookings}
                className="rounded-full border border-slate-700 px-5 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
              >
                Refresh
              </button>

              <button
                onClick={() => router.push("/transport/new")}
                className="rounded-full bg-amber-400 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
              >
                New Booking
              </button>
            </div>

            <p className="mt-4 text-[12px] text-slate-400">
              Use this module for airport pickups, Makkah–Madinah intercity
              rides, ziyarat circuits and VIP guest movement.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 md:p-6">
              <h3 className="mb-3 text-lg font-semibold">Popular routes</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-300">
                <li>Jeddah Airport → Makkah Hotel</li>
                <li>Makkah → Madinah intercity transfer</li>
                <li>Madinah Hotel → Madinah Airport</li>
                <li>Ziyarat in Makkah, Madinah, Taif and Badr</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 md:p-6">
              <h3 className="mb-3 text-lg font-semibold">Why book via Arfeen Travel?</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-300">
                <li>Private transport with premium support</li>
                <li>Agent-friendly workflow and faster coordination</li>
                <li>Ideal for Umrah families, groups and VIP guests</li>
                <li>Clear route handling and booking status tracking</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 md:p-6">
              <h3 className="mb-3 text-lg font-semibold">Operations note</h3>
              <p className="text-sm text-slate-300">
                Edit, complete, cancel or delete bookings directly from the
                dashboard once records are loaded from the transport module API.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl">
          <div className="border-b border-slate-800 px-5 py-4 md:px-6">
            <h2 className="text-lg font-semibold md:text-xl">Booking List</h2>
            <p className="mt-1 text-sm text-slate-400">
              {loading
                ? "Loading bookings..."
                : `${filteredBookings.length} booking${
                    filteredBookings.length === 1 ? "" : "s"
                  } found`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-950/70 text-slate-300">
                <tr>
                  <th className="px-5 py-4 font-medium">Customer</th>
                  <th className="px-5 py-4 font-medium">Route</th>
                  <th className="px-5 py-4 font-medium">Pickup Time</th>
                  <th className="px-5 py-4 font-medium">Vehicle</th>
                  <th className="px-5 py-4 font-medium">Pax</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Total</th>
                  <th className="px-5 py-4 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800">
                {loading && (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                      Loading bookings...
                    </td>
                  </tr>
                )}

                {!loading && filteredBookings.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12">
                      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 px-6 py-12 text-center">
                        <div className="text-2xl font-semibold text-white">
                          No bookings found
                        </div>
                        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">
                          No transport bookings match the current filters. Create a
                          new booking or adjust the search and status filter to view
                          records.
                        </p>
                        <button
                          onClick={() => router.push("/transport/new")}
                          className="mt-5 rounded-full bg-amber-400 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300"
                        >
                          Create New Booking
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredBookings.map((b) => (
                    <tr key={b.id} className="align-top transition hover:bg-slate-800/30">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">
                          {b.customer_name || "—"}
                        </div>
                        <div className="mt-1 text-slate-400">
                          {b.customer_phone || "—"}
                        </div>
                        {(b.agent_name || b.agent_code) && (
                          <div className="mt-2 text-xs text-slate-500">
                            Agent: {b.agent_name || "—"}
                            {b.agent_code ? ` (${b.agent_code})` : ""}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">{b.pickup_city}</div>
                        <div className="text-slate-400">{b.pickup_location}</div>

                        <div className="my-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                          To
                        </div>

                        <div className="font-semibold text-white">{b.dropoff_city}</div>
                        <div className="text-slate-400">{b.dropoff_location}</div>
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {formatDateTime(b.pickup_time)}
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {b.vehicle_type || "—"}
                      </td>

                      <td className="px-5 py-4 text-slate-300">
                        {b.passengers ?? "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                            b.status
                          )}`}
                        >
                          {normalizeStatusLabel(b.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-semibold text-white">
                        {formatCurrency(b.total_price)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() =>
                              router.push(`/transport/bookings/${b.id}/edit`)
                            }
                            className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
                          >
                            Edit
                          </button>

                          {b.status !== "completed" && (
                            <button
                              onClick={() => updateStatus(b.id, "completed")}
                              className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300 transition hover:bg-emerald-500/20"
                            >
                              Complete
                            </button>
                          )}

                          {b.status !== "cancelled" && (
                            <button
                              onClick={() => updateStatus(b.id, "cancelled")}
                              className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300 transition hover:bg-amber-500/20"
                            >
                              Cancel
                            </button>
                          )}

                          <button
                            onClick={() => deleteBooking(b.id)}
                            className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-500/20"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}