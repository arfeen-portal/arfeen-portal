"use client";

import { useEffect, useMemo, useState } from "react";

type AlertRow = {
  source_id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  action_url: string;
  created_at: string;
};

function severityClass(severity: string) {
  if (severity === "critical") return "border-red-200 bg-red-50 text-red-700";
  if (severity === "high") return "border-orange-200 bg-orange-50 text-orange-700";
  if (severity === "medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export default function SmartAlertsPage() {
  const [rows, setRows] = useState<AlertRow[]>([]);
  const [severity, setSeverity] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAlerts() {
      const res = await fetch("/api/accounts/smart-alerts", { cache: "no-store" });
      const json = await res.json();
      setRows(json.data || []);
      setLoading(false);
    }

    loadAlerts();
  }, []);

  const filteredRows = useMemo(() => {
    if (severity === "all") return rows;
    return rows.filter((row) => row.severity === severity);
  }, [rows, severity]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
        <p className="text-sm text-blue-200">AI Operations</p>
        <h1 className="mt-2 text-3xl font-bold">Smart Alerts Upgrade</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-300">
          Real-time business alerts generated from accounts, transport pricing and profit leak intelligence.
        </p>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        {[
          ["Total Alerts", rows.length],
          ["Critical", rows.filter((row) => row.severity === "critical").length],
          ["High", rows.filter((row) => row.severity === "high").length],
          ["Medium", rows.filter((row) => row.severity === "medium").length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
          </div>
        ))}
      </section>

      <div className="mb-5 flex justify-end">
        <select
          className="rounded-xl border bg-white px-4 py-3 text-sm shadow-sm"
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
        >
          <option value="all">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-slate-500">Loading smart alerts...</div>
      ) : (
        <div className="grid gap-4">
          {filteredRows.map((row) => (
            <div key={`${row.alert_type}-${row.source_id}`} className={`rounded-2xl border p-5 shadow-sm ${severityClass(row.severity)}`}>
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide">{row.severity}</p>
                  <h2 className="mt-1 text-lg font-bold">{row.title}</h2>
                  <p className="mt-1 text-sm">{row.message}</p>
                </div>

                <a
                  href={row.action_url}
                  className="rounded-xl bg-slate-950 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Review
                </a>
              </div>
            </div>
          ))}

          {filteredRows.length === 0 && (
            <div className="rounded-2xl border bg-white p-8 text-center text-sm text-slate-500">
              No alerts found for this filter.
            </div>
          )}
        </div>
      )}
    </main>
  );
}