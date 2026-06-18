"use client";

import { useEffect, useMemo, useState } from "react";

type DashboardData = {
  stats: Record<string, number>;
  lists: Record<string, any[]>;
  auto_systems: any[];
  generated_at: string;
};

const statLabels: Record<string, string> = {
  all_arrivals: "All Arrivals",
  all_departures: "All Departures",
  delayed_transport: "Delayed Transport",
  vip_passengers: "VIP Passengers",
  hotel_occupancy: "Hotel Occupancy",
  active_drivers: "Active Drivers",
  pending_payments: "Pending Payments",
  live_sales: "Live Sales",
  low_profit_alerts: "Low Profit Alerts",
};

export default function OperationsLiveControlPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/oprations/livecontrol", {
        cache: "no-store",
      });
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  async function systemAction(system_key: string, action: "toggle" | "run_now") {
    setBusyKey(system_key + action);
    try {
      await fetch("/api/oprations/livecontrol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system_key, action }),
      });
      await loadData();
    } finally {
      setBusyKey(null);
    }
  }

  useEffect(() => {
    loadData();
    const t = setInterval(loadData, 30000);
    return () => clearInterval(t);
  }, []);

  const stats = useMemo(() => data?.stats || {}, [data]);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 shadow-2xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
                Operations Control Tower
              </p>
              <h1 className="mt-2 text-3xl font-black md:text-5xl">
                Live Arrivals, Drivers, Payments & Auto Systems
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-300">
                Real-time operational dashboard for arrivals, departures,
                delayed transport, VIP passengers, occupancy, drivers, sales and
                automated recovery workflows.
              </p>
            </div>

            <button
              onClick={loadData}
              className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg hover:bg-cyan-300"
            >
              {loading ? "Refreshing..." : "Refresh Live Data"}
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(statLabels).map(([key, label]) => (
            <div
              key={key}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl"
            >
              <p className="text-sm text-slate-400">{label}</p>
              <h2 className="mt-3 text-3xl font-black">
                {key === "live_sales"
                  ? `SAR ${Number(stats[key] || 0).toLocaleString()}`
                  : Number(stats[key] || 0).toLocaleString()}
              </h2>
              <p className="mt-2 text-xs text-slate-500">
                Updated from live booking/accounting data
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <Panel title="Today Arrivals" rows={data?.lists?.arrivals || []} />
          <Panel title="Today Departures" rows={data?.lists?.departures || []} />
          <Panel
            title="Delayed Transport"
            rows={data?.lists?.delayed_transport || []}
          />
          <Panel
            title="VIP Passengers"
            rows={data?.lists?.vip_passengers || []}
          />
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl">
          <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-black">Auto Systems</h2>
              <p className="text-sm text-slate-400">
                Toggle or run automation engines manually.
              </p>
            </div>
            <span className="rounded-full bg-emerald-400/10 px-4 py-2 text-xs font-bold text-emerald-300">
              {data?.auto_systems?.filter((s) => s.is_enabled).length || 0}{" "}
              Active
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(data?.auto_systems || []).map((sys) => (
              <div
                key={sys.system_key}
                className="rounded-3xl border border-white/10 bg-slate-900 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black">{sys.system_name}</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      {sys.description}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      sys.is_enabled
                        ? "bg-emerald-400/10 text-emerald-300"
                        : "bg-red-400/10 text-red-300"
                    }`}
                  >
                    {sys.is_enabled ? "ON" : "OFF"}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-slate-400">
                  <div className="rounded-2xl bg-white/[0.04] p-3">
                    Severity
                    <div className="mt-1 font-bold text-white">
                      {sys.severity || "medium"}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/[0.04] p-3">
                    Runs
                    <div className="mt-1 font-bold text-white">
                      {sys.total_runs || 0}
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => systemAction(sys.system_key, "toggle")}
                    disabled={busyKey === sys.system_key + "toggle"}
                    className="flex-1 rounded-2xl bg-white px-4 py-2 text-sm font-bold text-slate-950 hover:bg-slate-200 disabled:opacity-50"
                  >
                    Toggle
                  </button>
                  <button
                    onClick={() => systemAction(sys.system_key, "run_now")}
                    disabled={busyKey === sys.system_key + "run_now"}
                    className="flex-1 rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
                  >
                    Run Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <Panel
            title="Low Profit / Profitability Alerts"
            rows={data?.lists?.low_profit_bookings || []}
          />
          <Panel
            title="Recent Control Events"
            rows={data?.lists?.events || []}
          />
        </section>
      </div>
    </main>
  );
}

function Panel({ title, rows }: { title: string; rows: any[] }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-black">{title}</h2>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300">
          {rows.length}
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.06] text-xs uppercase text-slate-400">
            <tr>
              <th className="p-3">Customer / Title</th>
              <th className="p-3">Route / Status</th>
              <th className="p-3">Time / Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="p-4 text-slate-500" colSpan={3}>
                  No live records found.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={r.id || i} className="border-t border-white/10">
                  <td className="p-3 font-semibold text-white">
                    {r.customer_name || r.title || r.name || "—"}
                    <div className="text-xs font-normal text-slate-500">
                      {r.customer_phone || r.description || ""}
                    </div>
                  </td>
                  <td className="p-3 text-slate-300">
                    {r.pickup_city || r.pickup_location || r.event_type || "—"}{" "}
                    → {r.dropoff_city || r.dropoff_location || r.status || "—"}
                  </td>
                  <td className="p-3 text-slate-300">
                    {r.pickup_time
                      ? new Date(r.pickup_time).toLocaleString()
                      : r.amount
                      ? `SAR ${Number(r.amount).toLocaleString()}`
                      : r.created_at
                      ? new Date(r.created_at).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}