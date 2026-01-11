"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

type BookingStatus = "pending" | "confirmed" | "cancelled";

interface BookingRow {
  id: string;
  agent_name: string | null;
  agent_code: string | null;
  passengers: number;
  status: BookingStatus;
}

interface AgentStats {
  key: string;
  agent_name: string;
  agent_code: string;
  total_bookings: number;
  total_passengers: number;
  pending: number;
  confirmed: number;
  cancelled: number;
}

export default function AgentAnalyticsPage() {
  const supabase = useMemo(() => getSupabaseClient(), []);

  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("umrah_bookings")
        .select("id, agent_name, agent_code, passengers, status");

      if (error) {
        console.error(error);
        setError("Failed to load agent analytics data");
        setLoading(false);
        return;
      }

      setRows(
        (data || []).map((r: any) => ({
          id: r.id,
          agent_name: r.agent_name,
          agent_code: r.agent_code,
          passengers: r.passengers ?? 0,
          status: (r.status ?? "pending") as BookingStatus,
        }))
      );

      setLoading(false);
    };

    load();
  }, [supabase]);

  const stats = useMemo<AgentStats[]>(() => {
    const map = new Map<string, AgentStats>();

    for (const r of rows) {
      if (!r.agent_name && !r.agent_code) continue;

      const name = r.agent_name ?? "Unknown Agent";
      const code = r.agent_code ?? "";
      const key = `${name}|${code}`;

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
      s.total_passengers += r.passengers;

      if (r.status === "pending") s.pending += 1;
      if (r.status === "confirmed") s.confirmed += 1;
      if (r.status === "cancelled") s.cancelled += 1;
    }

    let arr = Array.from(map.values());

    if (statusFilter !== "all") {
      arr = arr.filter((a) => a[statusFilter] > 0);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(
        (a) =>
          a.agent_name.toLowerCase().includes(q) ||
          a.agent_code.toLowerCase().includes(q)
      );
    }

    return arr.sort((a, b) => b.total_bookings - a.total_bookings);
  }, [rows, search, statusFilter]);

  const totals = useMemo(() => {
    let bookings = 0;
    let passengers = 0;

    for (const a of stats) {
      bookings += a.total_bookings;
      passengers += a.total_passengers;
    }

    return { bookings, passengers };
  }, [stats]);

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Agent Analytics
            </h1>
            <p className="text-sm text-slate-500">
              Umrah booking performance by agent
            </p>
          </div>
          <div className="text-xs font-semibold bg-sky-900 text-white px-3 py-1 rounded-full">
            Arfeen Travel · Agents
          </div>
        </header>

        {/* Filters */}
        <section className="flex flex-wrap gap-3 bg-white p-4 rounded-xl shadow">
          {(["all", "pending", "confirmed", "cancelled"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-1 rounded-full text-sm font-semibold ${
                statusFilter === st
                  ? "bg-sky-900 text-white"
                  : "border border-slate-300 text-slate-700"
              }`}
            >
              {st === "all"
                ? "All"
                : st.charAt(0).toUpperCase() + st.slice(1)}
            </button>
          ))}

          <input
            className="ml-auto px-4 py-1 border rounded-full text-sm"
            placeholder="Search agent name / code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </section>

        {/* Totals */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow">
            <p className="text-xs text-slate-500">Total Bookings</p>
            <p className="text-2xl font-bold">{totals.bookings}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow">
            <p className="text-xs text-slate-500">Total Passengers</p>
            <p className="text-2xl font-bold">{totals.passengers}</p>
          </div>
        </section>

        {/* Table */}
        <section className="bg-white p-4 rounded-xl shadow overflow-x-auto">
          {loading && <p className="text-sm">Loading agent data…</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {!loading && stats.length === 0 && (
            <p className="text-sm text-slate-500">No data found.</p>
          )}

          {!loading && stats.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2">Agent</th>
                  <th>Code</th>
                  <th className="text-right">Bookings</th>
                  <th className="text-right">Passengers</th>
                  <th className="text-right">Pending</th>
                  <th className="text-right">Confirmed</th>
                  <th className="text-right">Cancelled</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((a) => (
                  <tr
                    key={a.key}
                    className="border-b hover:bg-slate-50"
                  >
                    <td className="py-2 font-semibold">{a.agent_name}</td>
                    <td>{a.agent_code || "-"}</td>
                    <td className="text-right">{a.total_bookings}</td>
                    <td className="text-right">{a.total_passengers}</td>
                    <td className="text-right">{a.pending}</td>
                    <td className="text-right">{a.confirmed}</td>
                    <td className="text-right">{a.cancelled}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  );
}
