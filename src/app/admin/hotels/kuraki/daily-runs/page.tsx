"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Plus, RefreshCcw, Utensils } from "lucide-react";

const emptyForm = {
  contract_id: "",
  run_date: new Date().toISOString().slice(0, 10),
  meal_type: "full_board",
  planned_pax: "",
  actual_pax: "",
  meals_served: "",
  shortage_count: "",
  waste_count: "",
  quality_note: "",
  supplier_status: "pending",
  staff_id: "",
  status: "pending",
};

export default function KhurakiDailyRunsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadMeta() {
    const [contractsJson, staffJson] = await Promise.all([
      fetch("/api/hotels/khuraki", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/hotels/khuraki/staff", { cache: "no-store" }).then((r) => r.json()),
    ]);

    if (contractsJson.ok) setContracts(contractsJson.contracts || []);
    if (staffJson.ok) setStaff(staffJson.staff || []);
  }

  async function load() {
    setLoading(true);
    setMessage("");

    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);

    const data = await fetch(`/api/hotels/khuraki/daily-runs?${params}`, {
      cache: "no-store",
    }).then((r) => r.json());

    if (data.ok) {
      setRows(data.daily_runs || []);
    } else {
      setMessage(data.error || "Daily runs load nahi ho sake.");
    }

    setLoading(false);
  }

  async function save() {
    setMessage("");

    const data = await fetch("/api/hotels/khuraki/daily-runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).then((r) => r.json());

    if (data.ok) {
      setForm(emptyForm);
      await load();
    } else {
      setMessage(data.error || "Daily run save failed.");
    }
  }

  async function updateStatus(id: string, nextStatus: string) {
    const data = await fetch("/api/hotels/khuraki/daily-runs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: nextStatus }),
    }).then((r) => r.json());

    if (data.ok) {
      await load();
    } else {
      setMessage(data.error || "Status update failed.");
    }
  }

  useEffect(() => {
    load();
  }, [status]);

  useEffect(() => {
    loadMeta();
  }, []);

  function contractLabel(contractId: string | null) {
    const contract = contracts.find((item) => item.id === contractId);
    if (!contract) return contractId || "-";
    return `${contract.title} · ${contract.city}`;
  }

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc.planned += Number(row.planned_pax || 0);
          acc.actual += Number(row.actual_pax || 0);
          acc.served += Number(row.meals_served || 0);
          acc.shortage += Number(row.shortage_count || 0);
          acc.waste += Number(row.waste_count || 0);
          return acc;
        },
        { planned: 0, actual: 0, served: 0, shortage: 0, waste: 0 }
      ),
    [rows]
  );

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/20 to-slate-900 p-6">
          <div className="flex items-center gap-3 text-emerald-300">
            <CalendarDays />
            <p className="text-sm font-bold uppercase tracking-[0.2em]">
              Hotel Khuraki Daily Operations
            </p>
          </div>
          <h1 className="mt-3 text-3xl font-black">Daily Runs</h1>
          <p className="mt-2 text-slate-300">
            Planned pax, actual pax, meals served, shortage, waste aur supplier status daily track karein.
          </p>
        </section>

        {message ? (
          <div className="rounded-2xl border border-red-300/30 bg-red-500/10 p-4 text-sm text-red-200">
            {message}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-5">
          <Stat title="Planned Pax" value={totals.planned} />
          <Stat title="Actual Pax" value={totals.actual} />
          <Stat title="Meals Served" value={totals.served} />
          <Stat title="Shortage" value={totals.shortage} danger />
          <Stat title="Waste" value={totals.waste} danger />
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Create Daily Run</h2>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="issue">Issue</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {contracts.length ? (
              <select
                value={form.contract_id}
                onChange={(e) => setForm({ ...form, contract_id: e.target.value })}
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
              >
                <option value="">Select Contract</option>
                {contracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    {contract.title} · {contract.city}
                  </option>
                ))}
              </select>
            ) : (
              <input
                placeholder="Contract ID"
                value={form.contract_id}
                onChange={(e) => setForm({ ...form, contract_id: e.target.value })}
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
              />
            )}
            <input
              type="date"
              value={form.run_date}
              onChange={(e) => setForm({ ...form, run_date: e.target.value })}
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
            />
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
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
            >
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="issue">Issue</option>
              <option value="closed">Closed</option>
            </select>
            {[
              ["planned_pax", "Planned Pax"],
              ["actual_pax", "Actual Pax"],
              ["meals_served", "Meals Served"],
              ["shortage_count", "Shortage Count"],
              ["waste_count", "Waste Count"],
            ].map(([key, label]) => (
              <input
                key={key}
                type="number"
                placeholder={label}
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
              />
            ))}
            <input
              placeholder="Supplier Status"
              value={form.supplier_status}
              onChange={(e) => setForm({ ...form, supplier_status: e.target.value })}
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
            />
            {staff.length ? (
              <select
                value={form.staff_id}
                onChange={(e) => setForm({ ...form, staff_id: e.target.value })}
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
              >
                <option value="">Select Staff / Checker</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name} · {member.role}
                  </option>
                ))}
              </select>
            ) : (
              <input
                placeholder="Staff / Checker ID"
                value={form.staff_id}
                onChange={(e) => setForm({ ...form, staff_id: e.target.value })}
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
              />
            )}
            <textarea
              placeholder="Quality note"
              value={form.quality_note}
              onChange={(e) => setForm({ ...form, quality_note: e.target.value })}
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 md:col-span-3"
            />
            <button
              onClick={save}
              className="flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 font-bold text-slate-950"
            >
              <Plus size={16} /> Save Run
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <h2 className="text-lg font-bold">Daily Run List</h2>
            <button
              onClick={load}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-bold"
            >
              <RefreshCcw size={14} /> Refresh
            </button>
          </div>
          <table className="w-full min-w-[1050px] text-left">
            <thead className="bg-white/[0.06] text-sm text-slate-300">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Contract</th>
                <th className="p-4">Meal</th>
                <th className="p-4">Planned</th>
                <th className="p-4">Actual</th>
                <th className="p-4">Served</th>
                <th className="p-4">Shortage</th>
                <th className="p-4">Waste</th>
                <th className="p-4">Supplier</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="p-6 text-slate-400">
                    Loading daily runs...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-6 text-slate-400">
                    No daily runs found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-white/10">
                    <td className="p-4">{row.run_date}</td>
                    <td className="p-4">{contractLabel(row.contract_id)}</td>
                    <td className="p-4 capitalize">{String(row.meal_type || "-").replace("_", " ")}</td>
                    <td className="p-4">{row.planned_pax || 0}</td>
                    <td className="p-4">{row.actual_pax || 0}</td>
                    <td className="p-4">{row.meals_served || 0}</td>
                    <td className="p-4 text-red-300">{row.shortage_count || 0}</td>
                    <td className="p-4 text-amber-300">{row.waste_count || 0}</td>
                    <td className="p-4">{row.supplier_status || "-"}</td>
                    <td className="p-4">{row.status || "pending"}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => updateStatus(row.id, "verified")}
                          className="rounded-xl bg-emerald-500/20 px-3 py-2 text-xs font-bold text-emerald-300"
                        >
                          Verify
                        </button>
                        <button
                          onClick={() => updateStatus(row.id, "issue")}
                          className="rounded-xl bg-red-500/20 px-3 py-2 text-xs font-bold text-red-300"
                        >
                          Issue
                        </button>
                        <button
                          onClick={() => updateStatus(row.id, "closed")}
                          className="rounded-xl bg-blue-500/20 px-3 py-2 text-xs font-bold text-blue-300"
                        >
                          Close
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

function Stat({ title, value, danger = false }: any) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className={danger ? "mb-3 text-red-300" : "mb-3 text-emerald-300"}>
        <Utensils />
      </div>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-sm text-slate-400">{title}</div>
    </div>
  );
}
