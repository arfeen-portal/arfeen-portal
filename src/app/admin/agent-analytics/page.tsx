"use client";

import { useEffect, useState, useMemo } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

const supabase = useMemo(() => getSupabaseClient(), []);
  

type BookingStatus = "pending" | "confirmed" | "cancelled";

interface AgentRow {
  id: string;
  agent_name: string | null;
  agent_code: string | null;
  passengers: number;
  status: BookingStatus;
}

interface AgentStats {
  key: string; // name|code
  agent_name: string;
  agent_code: string | null;
  total_bookings: number;
  total_passengers: number;
  pending: number;
  confirmed: number;
  cancelled: number;
}

export default function AgentAnalyticsPage() {
  const [rows, setRows] = useState<AgentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>(
    "all"
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("umrah_bookings")
        .select("id, agent_name, agent_code, passengers, status");

      if (error) {
        console.error(error);
        setError("Failed to load agent analytics data.");
        setRows([]);
        setLoading(false);
        return;
      }

      const mapped: AgentRow[] =
        data?.map((r: any) => ({
          id: r.id,
          agent_name: r.agent_name,
          agent_code: r.agent_code,
          passengers: r.passengers ?? 1,
          status: (r.status ?? "pending") as BookingStatus,
        })) ?? [];

      setRows(mapped);
      setLoading(false);
    };

    load();
  }, []);

  const stats = useMemo<AgentStats[]>(() => {
    const map = new Map<string, AgentStats>();

    for (const r of rows) {
      if (!r.agent_name && !r.agent_code) continue; // no agent set

      const name = r.agent_name || "Unknown Agent";
      const code = r.agent_code || null;
      const key = `${name}|${code ?? ""}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          agent_name: name,
          agent_code: code,
          total_bookings: 0,
          total_passengers: 0,
          pending: 0,
          confirmed: 0,
          cancelled: 0,
        });
      }

      const s = map.get(key)!;
      s.total_bookings += 1;
      s.total_passengers += r.passengers || 0;
      if (r.status === "pending") s.pending += 1;
      if (r.status === "confirmed") s.confirmed += 1;
      if (r.status === "cancelled") s.cancelled += 1;
    }

    let arr = Array.from(map.values());

    // Filter by status + search
    if (statusFilter !== "all") {
      arr = arr.filter((a) => a[statusFilter] > 0);
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      arr = arr.filter((a) => {
        const haystack =
          (a.agent_name ?? "").toLowerCase() +
          " " +
          (a.agent_code ?? "").toLowerCase();
        return haystack.includes(s);
      });
    }

    // Sort by total bookings desc
    arr.sort((a, b) => b.total_bookings - a.total_bookings);

    return arr;
  }, [rows, search, statusFilter]);

  const totals = useMemo(() => {
    let totalBookings = 0;
    let totalPassengers = 0;
    for (const a of stats) {
      totalBookings += a.total_bookings;
      totalPassengers += a.total_passengers;
    }
    return { totalBookings, totalPassengers };
  }, [stats]);

  return (
    <main className="min-h-screen bg-slate-100 pb-12">
      <div className="mx-auto max-w-6xl px-4 pt-8">
        {/* HEADER */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Agent-wise Analytics
            </h1>
            <p className="mt-1 text-xs md:text-sm text-slate-500">
              See which agents are sending more Umrah bookings and passengers.
            </p>
          </div>
          <div className="rounded-full bg-sky-900 px-4 py-2 text-[11px] font-semibold text-slate-100">
            Arfeen Travel &amp; Tours • Agents Performance
          </div>
        </header>

        {/* FILTERS + SUMMARY */}
        <section className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {(["all", "pending", "confirmed", "cancelled"] as const).map(
              (st) => {
                const isActive = statusFilter === st;
                const label =
                  st === "all"
                    ? "All"
                    : st.charAt(0).toUpperCase() + st.slice(1);
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      isActive
                        ? "border-sky-900 bg-sky-900 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                );
              }
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <input
              type="text"
              placeholder="Search agent name / code…"
              className="w-44 md:w-64 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </section>

        {/* TOP SUMMARY CARDS */}
        <section className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="rounded-2xl border bg-white px-4 py-3 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">
              Active Agents
            </div>
            <div className="mt-1 text-2xl font-bold text-slate-900">
              {stats.length}
            </div>
          </div>
          <div className="rounded-2xl border bg-white px-4 py-3 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">
              Agent Bookings
            </div>
            <div className="mt-1 text-2xl font-bold text-slate-900">
              {totals.totalBookings}
            </div>
          </div>
          <div className="rounded-2xl border bg-white px-4 py-3 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">
              Agent Passengers
            </div>
            <div className="mt-1 text-2xl font-bold text-slate-900">
              {totals.totalPassengers}
            </div>
          </div>
        </section>

        {/* TABLE */}
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          {loading ? (
            <div className="text-xs text-slate-500">
              Loading agent data…
            </div>
          ) : error ? (
            <div className="text-xs text-red-600">{error}</div>
          ) : stats.length === 0 ? (
            <div className="text-xs text-slate-500">
              No agent-linked bookings yet. Add{" "}
              <code className="rounded bg-slate-100 px-1">
                agent_name / agent_code
              </code>{" "}
              in <code>umrah_bookings</code>.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-[11px] md:text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Agent</th>
                    <th className="px-3 py-2 text-left">Code</th>
                    <th className="px-3 py-2 text-right">Bookings</th>
                    <th className="px-3 py-2 text-right">Passengers</th>
                    <th className="px-3 py-2 text-right">Pending</th>
                    <th className="px-3 py-2 text-right">Confirmed</th>
                    <th className="px-3 py-2 text-right">Cancelled</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((a) => (
                    <tr
                      key={a.key}
                      className="border-t border-slate-100 hover:bg-slate-50/60"
                    >
                      <td className="px-3 py-2">
                        <span className="font-semibold text-slate-900">
                          {a.agent_name}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {a.agent_code ?? "-"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {a.total_bookings}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {a.total_passengers}
                      </td>
                      <td className="px-3 py-2 text-right text-amber-600">
                        {a.pending}
                      </td>
                      <td className="px-3 py-2 text-right text-emerald-600">
                        {a.confirmed}
                      </td>
                      <td className="px-3 py-2 text-right text-red-600">
                        {a.cancelled}
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
