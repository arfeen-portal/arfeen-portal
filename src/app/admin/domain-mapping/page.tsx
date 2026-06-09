"use client";

import { useEffect, useState } from "react";

export default function DomainMappingPage() {
  const [domains, setDomains] = useState<any[]>([]);
  const [form, setForm] = useState({ domain: "", status: "active", auto_detect: true });

  async function load() {
    const res = await fetch("/api/admin/domains", { cache: "no-store" });
    const json = await res.json();
    if (json.ok) setDomains(json.domains || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    await fetch("/api/admin/domains", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ domain: "", status: "active", auto_detect: true });
    await load();
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-slate-950 p-8 text-white">
          <p className="text-sm text-blue-300">Middleware Powered</p>
          <h1 className="mt-2 text-3xl font-bold">Domain Auto-detection</h1>
          <p className="mt-2 text-sm text-slate-300">Custom domains ko tenant/theme ke sath map karein.</p>
        </section>

        <section className="rounded-3xl border bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              placeholder="agent-domain.com"
              value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
              className="rounded-xl border px-4 py-3 text-sm md:col-span-2"
            />
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="rounded-xl border px-4 py-3 text-sm"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="blocked">Blocked</option>
            </select>
            <button onClick={save} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
              Save Mapping
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="px-5 py-3">Domain</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Auto Detect</th>
                <th className="px-5 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="px-5 py-4 font-semibold">{d.domain}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">{d.status}</span>
                  </td>
                  <td className="px-5 py-4">{d.auto_detect ? "Yes" : "No"}</td>
                  <td className="px-5 py-4 text-slate-500">{new Date(d.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}