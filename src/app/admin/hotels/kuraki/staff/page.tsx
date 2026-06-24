"use client";

import { useEffect, useState } from "react";
import { Plus, ShieldCheck, UserRoundCheck } from "lucide-react";

export default function KhurakiStaffPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    role: "checker",
    city: "makkah",
  });

  async function load() {
    const data = await fetch("/api/hotels/khuraki/staff", {
      cache: "no-store",
    }).then((r) => r.json());

    if (data.ok) setRows(data.staff || []);
  }

  async function save() {
    const data = await fetch("/api/hotels/khuraki/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).then((r) => r.json());

    if (data.ok) {
      setForm({ full_name: "", phone: "", role: "checker", city: "makkah" });
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
          <h1 className="text-3xl font-black">Hotel Khuraki Staff IDs</h1>
          <p className="mt-2 text-slate-300">
            Check-in, checkout, calling aur hotel verification ke liye staff IDs.
          </p>
        </div>

        <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-5 md:grid-cols-5">
          <input
            placeholder="Full name"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 md:col-span-2"
          />
          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
          >
            <option value="manager">Manager</option>
            <option value="checker">Checker</option>
            <option value="caller">Caller</option>
            <option value="accountant">Accountant</option>
            <option value="supervisor">Supervisor</option>
          </select>
          <button onClick={save} className="flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-4 py-3 font-bold text-slate-950">
            <Plus size={16} /> Add
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04]">
          {rows.map((s) => (
            <div key={s.id} className="flex items-center justify-between border-b border-white/10 p-4">
              <div className="flex items-center gap-3">
                <UserRoundCheck className="text-amber-300" />
                <div>
                  <div className="font-bold">{s.full_name}</div>
                  <div className="text-sm text-slate-400">{s.phone || "-"} · {s.city}</div>
                </div>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                <ShieldCheck size={13} /> {s.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}