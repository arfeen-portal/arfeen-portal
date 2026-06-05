"use client";

import { useEffect, useState } from "react";

export default function IntegrationApiTestingPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    provider: "",
    method: "GET",
    endpoint: "",
    headersText: "{}",
    bodyText: "{}",
  });
  const [running, setRunning] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/integration-tests", { cache: "no-store" });
    const json = await res.json();
    if (json.ok) setTests(json.tests || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function runTest() {
    setRunning(true);
    await fetch("/api/admin/integration-tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        provider: form.provider,
        method: form.method,
        endpoint: form.endpoint,
        headers: JSON.parse(form.headersText || "{}"),
        body: JSON.parse(form.bodyText || "{}"),
      }),
    });
    setRunning(false);
    await load();
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-indigo-950 to-slate-950 p-8 text-white">
          <p className="text-sm text-indigo-200">Supplier/API Health Lab</p>
          <h1 className="mt-2 text-3xl font-bold">Integration API Testing Panel</h1>
          <p className="mt-2 text-sm text-slate-300">Transport, hotel, visa, payment gateway aur external APIs ko test karein.</p>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-bold">Run New Test</h2>
            <div className="space-y-3">
              <input className="w-full rounded-xl border px-4 py-3 text-sm" placeholder="Test name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input className="w-full rounded-xl border px-4 py-3 text-sm" placeholder="Provider e.g. Hotel API" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} />
              <select className="w-full rounded-xl border px-4 py-3 text-sm" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                <option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option>
              </select>
              <input className="w-full rounded-xl border px-4 py-3 text-sm" placeholder="https://api.example.com" value={form.endpoint} onChange={(e) => setForm({ ...form, endpoint: e.target.value })} />
              <textarea className="h-24 w-full rounded-xl border px-4 py-3 text-sm font-mono" value={form.headersText} onChange={(e) => setForm({ ...form, headersText: e.target.value })} />
              <textarea className="h-24 w-full rounded-xl border px-4 py-3 text-sm font-mono" value={form.bodyText} onChange={(e) => setForm({ ...form, bodyText: e.target.value })} />
              <button disabled={running} onClick={runTest} className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
                {running ? "Running..." : "Run Test"}
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border bg-white shadow-sm lg:col-span-2">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left">
                <tr>
                  <th className="px-5 py-3">Provider</th>
                  <th className="px-5 py-3">Endpoint</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Latency</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="px-5 py-4">
                      <div className="font-semibold">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.provider}</div>
                    </td>
                    <td className="max-w-xs truncate px-5 py-4 text-slate-600">{t.endpoint}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        Number(t.last_status) >= 200 && Number(t.last_status) < 300
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}>
                        {t.last_status || "Failed"}
                      </span>
                    </td>
                    <td className="px-5 py-4">{t.last_latency_ms || 0}ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}