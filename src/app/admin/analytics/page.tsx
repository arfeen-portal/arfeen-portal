"use client";

import { useEffect, useState } from "react";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);

  async function load() {
    const res = await fetch("/api/admin/analytics", { cache: "no-store" });
    const json = await res.json();
    if (json.ok) setData(json);
  }

  useEffect(() => {
    load();
  }, []);

  const stats = data?.stats || {};

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-8 text-white shadow-xl">
          <p className="text-sm text-blue-200">Real System Intelligence</p>
          <h1 className="mt-2 text-3xl font-bold">Admin Analytics Dashboard</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">
            Logs, API health, domains, themes, anomalies aur SaaS operational health ka live overview.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[
            ["Logs 7D", stats.logs_7d],
            ["Errors 7D", stats.errors_7d],
            ["Open Anomalies", stats.open_anomalies],
            ["Active Themes", stats.active_themes],
            ["Mapped Domains", stats.mapped_domains],
            ["Avg API Latency", `${stats.avg_latency_ms || 0}ms`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl border bg-white p-5 shadow-sm">
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <h2 className="mt-3 text-3xl font-bold text-slate-900">{value || 0}</h2>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">Recent API Tests</h2>
            <div className="space-y-3">
              {(data?.recentTests || []).map((t: any) => (
                <div key={t.id} className="flex items-center justify-between rounded-2xl border p-4">
                  <div>
                    <p className="font-semibold">Status {t.last_status || "Failed"}</p>
                    <p className="text-xs text-slate-500">{t.tested_at ? new Date(t.tested_at).toLocaleString() : "Not tested"}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">{t.last_latency_ms || 0}ms</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">Anomaly Queue</h2>
            <div className="space-y-3">
              {(data?.anomalies || []).slice(0, 8).map((a: any) => (
                <div key={a.id} className="rounded-2xl border p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{a.title}</p>
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-xs text-rose-700">{a.severity}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{a.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}