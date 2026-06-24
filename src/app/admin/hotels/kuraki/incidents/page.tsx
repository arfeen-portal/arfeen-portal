"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Brain, Plus } from "lucide-react";

export default function KhurakiIncidentsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({
    contract_id: "",
    incident_type: "other",
    severity: "medium",
    title: "",
    description: "",
  });

  async function load() {
    const data = await fetch("/api/hotels/khuraki/incidents", {
      cache: "no-store",
    }).then((r) => r.json());

    if (data.ok) setRows(data.incidents || []);
  }

  async function save() {
    const data = await fetch("/api/hotels/khuraki/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).then((r) => r.json());

    if (data.ok) {
      setForm({
        contract_id: "",
        incident_type: "other",
        severity: "medium",
        title: "",
        description: "",
      });
      load();
    } else {
      alert(data.error || "Error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/20 to-slate-900 p-6">
          <h1 className="text-3xl font-black">Hotel Khuraki Incidents</h1>
          <p className="mt-2 text-slate-300">
            Meal shortage, quality, delivery, checkout aur supplier issues yahan track honge.
          </p>
        </div>

        <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-5 md:grid-cols-4">
          <input
            placeholder="Contract ID"
            value={form.contract_id}
            onChange={(e) => setForm({ ...form, contract_id: e.target.value })}
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
          />
          <select
            value={form.incident_type}
            onChange={(e) => setForm({ ...form, incident_type: e.target.value })}
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
          >
            <option value="meal_shortage">Meal Shortage</option>
            <option value="meal_quality">Meal Quality</option>
            <option value="late_delivery">Late Delivery</option>
            <option value="checkout_issue">Checkout Issue</option>
            <option value="supplier_dispute">Supplier Dispute</option>
            <option value="other">Other</option>
          </select>
          <select
            value={form.severity}
            onChange={(e) => setForm({ ...form, severity: e.target.value })}
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 md:col-span-3"
          />
          <button onClick={save} className="flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 font-bold text-slate-950">
            <Plus size={16} /> Add
          </button>
        </div>

        <div className="space-y-3">
          {rows.map((incident) => (
            <div key={incident.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex gap-3">
                <AlertTriangle className={incident.severity === "critical" ? "text-red-300" : "text-amber-300"} />
                <div>
                  <div className="font-bold">{incident.title}</div>
                  <div className="text-sm text-slate-400">
                    {incident.incident_type} · {incident.severity}
                  </div>
                  {incident.description ? (
                    <p className="mt-2 text-sm text-slate-300">{incident.description}</p>
                  ) : null}
                  {incident.ai_recommendation ? (
                    <div className="mt-3 flex gap-2 rounded-2xl bg-blue-400/10 p-3 text-sm text-blue-100">
                      <Brain size={16} />
                      <span>{incident.ai_recommendation}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}