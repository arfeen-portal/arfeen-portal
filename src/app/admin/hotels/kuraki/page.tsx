"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  ChefHat,
  Plus,
  Search,
  Sparkles,
  Utensils,
} from "lucide-react";

type Contract = {
  id: string;
  title: string;
  city: string;
  meal_type: string;
  start_date: string;
  end_date: string;
  rate_per_person: number;
  currency: string;
  total_pax: number;
  status: string;
  ai_quality_score: number;
  ai_waste_risk: number;
  ai_shortage_risk: number;
};

export default function HotelKhurakiPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [city, setCity] = useState("all");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    city: "makkah",
    meal_type: "full_board",
    start_date: "",
    end_date: "",
    rate_per_person: "",
    total_pax: "",
    notes: "",
  });

  async function loadData() {
    setLoading(true);

    const params = new URLSearchParams();
    params.set("city", city);
    params.set("status", status);
    if (q) params.set("q", q);

    const res = await fetch(`/api/hotels/khuraki?${params.toString()}`, {
      cache: "no-store",
    });

    const data = await res.json();
    if (data.ok) {
      setContracts(data.contracts || []);
      setSummary(data.summary || {});
    }
    setLoading(false);
  }

  async function createContract() {
    const res = await fetch("/api/hotels/khuraki", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (data.ok) {
      setOpen(false);
      setForm({
        title: "",
        city: "makkah",
        meal_type: "full_board",
        start_date: "",
        end_date: "",
        rate_per_person: "",
        total_pax: "",
        notes: "",
      });
      loadData();
    } else {
      alert(data.error || "Error");
    }
  }

  useEffect(() => {
    loadData();
  }, [city, status]);

  const aiInsight = useMemo(() => {
    if (!contracts.length) return "Abhi khuraki contract add nahi hua.";
    const risky = contracts.filter(
      (x) => Number(x.ai_waste_risk) > 65 || Number(x.ai_shortage_risk) > 65
    );
    if (risky.length) return `${risky.length} contract high risk me hain. In par meal quantity aur supplier timing dobara check karein.`;
    return "System normal hai. Current contracts me shortage/waste risk controlled hai.";
  }, [contracts]);

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/20 via-slate-900 to-emerald-500/10 p-6 shadow-2xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-amber-300">
                <ChefHat size={20} />
                <span className="text-sm font-semibold uppercase tracking-widest">
                  Hotel Khuraki AI Control Center
                </span>
              </div>
              <h1 className="text-3xl font-bold md:text-4xl">
                Hotel Meal / Khuraki Management
              </h1>
              <p className="mt-2 max-w-3xl text-slate-300">
                Makkah/Madinah hotels, supplier contracts, pax planning, meal quality,
                shortage risk, waste control aur AI leakage detection ek jagah.
              </p>
            </div>

            <button
              onClick={() => setOpen(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 font-bold text-slate-950 shadow-lg hover:bg-amber-300"
            >
              <Plus size={18} />
              New Khuraki Contract
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <Stat title="Contracts" value={summary.total_contracts || 0} icon={<Utensils />} />
          <Stat title="Active" value={summary.active || 0} icon={<Activity />} />
          <Stat title="Total Pax" value={summary.total_pax || 0} icon={<ChefHat />} />
          <Stat title="AI Quality" value={`${summary.avg_quality || 0}%`} icon={<Brain />} />
          <Stat title="High Risk" value={summary.high_risk || 0} icon={<AlertTriangle />} />
        </div>

        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 text-emerald-300" />
            <div>
              <h2 className="font-bold text-emerald-200">AI Insight</h2>
              <p className="text-slate-200">{aiInsight}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadData()}
                placeholder="Search contract..."
                className="w-full rounded-2xl border border-white/10 bg-slate-900 py-3 pl-10 pr-4 outline-none focus:border-amber-400"
              />
            </div>

            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
            >
              <option value="all">All Cities</option>
              <option value="makkah">Makkah</option>
              <option value="madinah">Madinah</option>
              <option value="other">Other</option>
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-white/[0.06] text-sm text-slate-300">
              <tr>
                <th className="p-4">Contract</th>
                <th className="p-4">City</th>
                <th className="p-4">Meal</th>
                <th className="p-4">Pax</th>
                <th className="p-4">Rate</th>
                <th className="p-4">Quality</th>
                <th className="p-4">Waste Risk</th>
                <th className="p-4">Shortage Risk</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-6 text-slate-400" colSpan={9}>
                    Loading khuraki system...
                  </td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td className="p-6 text-slate-400" colSpan={9}>
                    No khuraki contract found.
                  </td>
                </tr>
              ) : (
                contracts.map((c) => (
                  <tr key={c.id} className="border-t border-white/10 hover:bg-white/[0.03]">
                    <td className="p-4">
                      <div className="font-bold">{c.title}</div>
                      <div className="text-xs text-slate-400">
                        {c.start_date} → {c.end_date}
                      </div>
                    </td>
                    <td className="p-4 capitalize">{c.city}</td>
                    <td className="p-4 capitalize">{c.meal_type.replace("_", " ")}</td>
                    <td className="p-4">{c.total_pax}</td>
                    <td className="p-4">
                      {c.currency} {c.rate_per_person}
                    </td>
                    <td className="p-4">
                      <Badge value={c.ai_quality_score} good />
                    </td>
                    <td className="p-4">
                      <Badge value={c.ai_waste_risk} />
                    </td>
                    <td className="p-4">
                      <Badge value={c.ai_shortage_risk} />
                    </td>
                    <td className="p-4">
                      <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
              <h2 className="mb-4 text-2xl font-bold">New Khuraki Contract</h2>

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  placeholder="Contract title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
                />
                <select
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
                >
                  <option value="makkah">Makkah</option>
                  <option value="madinah">Madinah</option>
                  <option value="other">Other</option>
                </select>
                <select
                  value={form.meal_type}
                  onChange={(e) => setForm({ ...form, meal_type: e.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="full_board">Full Board</option>
                </select>
                <input
                  type="number"
                  placeholder="Total Pax"
                  value={form.total_pax}
                  onChange={(e) => setForm({ ...form, total_pax: e.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
                />
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
                />
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
                />
                <input
                  type="number"
                  placeholder="Rate per person"
                  value={form.rate_per_person}
                  onChange={(e) => setForm({ ...form, rate_per_person: e.target.value })}
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
                />
              </div>

              <textarea
                placeholder="Notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-3 h-28 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
              />

              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-2xl border border-white/10 px-5 py-3 font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={createContract}
                  className="rounded-2xl bg-amber-400 px-5 py-3 font-bold text-slate-950"
                >
                  Save Contract
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ title, value, icon }: any) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-3 text-amber-300">{icon}</div>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-sm text-slate-400">{title}</div>
    </div>
  );
}

function Badge({ value, good = false }: any) {
  const n = Number(value || 0);
  const cls = good
    ? "bg-emerald-400/10 text-emerald-300"
    : n > 65
    ? "bg-red-400/10 text-red-300"
    : n > 40
    ? "bg-amber-400/10 text-amber-300"
    : "bg-emerald-400/10 text-emerald-300";

  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${cls}`}>{n}%</span>;
}