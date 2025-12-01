"use client";

import { useEffect, useState } from "react";

type RateRule = {
  id?: string;
  service_type: string;
  name: string;
  vehicle_type: string | null; // here = cabin_type
  min_distance_km: number | null; // here = min base fare (per pax)
  max_distance_km: number | null; // here = max base fare
  base_per_km: number | null; // optional, currently unused
  base_flat: number | null; // optional, currently unused
  use_flat: boolean;
  agent_commission_percent: number;
  profit_percent: number;
  priority: number;
  active: boolean;
};

const emptyRule: RateRule = {
  service_type: "flight",
  name: "",
  vehicle_type: "",
  min_distance_km: null,
  max_distance_km: null,
  base_per_km: null,
  base_flat: null,
  use_flat: false,
  agent_commission_percent: 0,
  profit_percent: 0,
  priority: 100,
  active: true,
};

export default function FlightRateRulesPage() {
  const [rules, setRules] = useState<RateRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<RateRule>({ ...emptyRule });
  const [message, setMessage] = useState<string | null>(null);

  async function loadRules() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/rates/rules/list?service=flight");
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to load rules");
        return;
      }
      setRules(data.rules || []);
    } catch (err) {
      console.error(err);
      setMessage("Error loading rules");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRules();
  }, []);

  function startNew() {
    setForm({ ...emptyRule });
  }

  function startEdit(rule: RateRule) {
    setForm({
      ...rule,
      vehicle_type: rule.vehicle_type || "",
    });
  }

  async function handleDelete(id?: string) {
    if (!id) return;
    if (!confirm("Delete this rule?")) return;

    try {
      const res = await fetch("/api/rates/rules/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete");
        return;
      }
      loadRules();
    } catch (err) {
      console.error(err);
      alert("Error deleting rule");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/rates/rules/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Failed to save rule");
        return;
      }
      setMessage("Rule saved successfully.");
      setForm({ ...emptyRule });
      loadRules();
    } catch (err) {
      console.error(err);
      setMessage("Error saving rule");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-2xl font-semibold">Flight Rate Rules</h1>
        <button
          type="button"
          onClick={startNew}
          className="px-4 py-2 text-sm rounded-md border"
        >
          New Rule
        </button>
      </div>

      {message && (
        <div className="border rounded-md px-4 py-2 text-sm">
          {message}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="border rounded-md p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Rule Name</label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Economy 0-1500 SAR"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Cabin / Class (blank = all)
            </label>
            <input
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.vehicle_type ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  vehicle_type: e.target.value || "",
                })
              }
              placeholder="economy / business / first"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Min Base Fare (per pax, SAR)
            </label>
            <input
              type="number"
              step="1"
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.min_distance_km ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  min_distance_km:
                    e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Max Base Fare (per pax, SAR)
            </label>
            <input
              type="number"
              step="1"
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.max_distance_km ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  max_distance_km:
                    e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Agent Commission %
            </label>
            <input
              type="number"
              step="0.1"
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.agent_commission_percent ?? 0}
              onChange={(e) =>
                setForm({
                  ...form,
                  agent_commission_percent:
                    e.target.value === "" ? 0 : Number(e.target.value),
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Profit %
            </label>
            <input
              type="number"
              step="0.1"
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.profit_percent ?? 0}
              onChange={(e) =>
                setForm({
                  ...form,
                  profit_percent:
                    e.target.value === "" ? 0 : Number(e.target.value),
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Priority (lower = higher)
            </label>
            <input
              type="number"
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.priority ?? 100}
              onChange={(e) =>
                setForm({
                  ...form,
                  priority:
                    e.target.value === "" ? 100 : Number(e.target.value),
                })
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="active_flight"
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                setForm({
                  ...form,
                  active: e.target.checked,
                })
              }
            />
            <label htmlFor="active_flight" className="text-sm">
              Active
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm rounded-md border bg-black text-white"
          >
            {saving ? "Saving..." : form.id ? "Update Rule" : "Create Rule"}
          </button>
          <button
            type="button"
            onClick={startNew}
            className="px-4 py-2 text-sm rounded-md border"
          >
            Clear
          </button>
        </div>
      </form>

      {/* List */}
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Cabin</th>
              <th className="px-3 py-2">Fare Range</th>
              <th className="px-3 py-2">Comm / Profit</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && rules.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center">
                  No rules yet.
                </td>
              </tr>
            )}

            {!loading &&
              rules.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">
                    {r.vehicle_type || <span className="text-gray-500">All</span>}
                  </td>
                  <td className="px-3 py-2">
                    {r.min_distance_km ?? "0"} – {r.max_distance_km ?? "∞"} SAR
                  </td>
                  <td className="px-3 py-2">
                    {r.agent_commission_percent ?? 0}% /{" "}
                    {r.profit_percent ?? 0}%
                  </td>
                  <td className="px-3 py-2">{r.priority}</td>
                  <td className="px-3 py-2">{r.active ? "Yes" : "No"}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-xs border rounded px-2 py-1"
                        onClick={() => startEdit(r)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="text-xs border rounded px-2 py-1"
                        onClick={() => handleDelete(r.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
