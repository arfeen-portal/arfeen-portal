"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

type GroupRow = {
  id: string;
  name: string;
  type: string;
};

export default function NewAccountPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    code: "",
    name: "",
    group_id: "",
    currency_code: "PKR",
    is_active: true,
  });

  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadGroups() {
      const { data } = await supabaseClient
        .from("acc_account_groups")
        .select("id,name,type")
        .order("type", { ascending: true })
        .order("name", { ascending: true });

      setGroups(data || []);
    }

    loadGroups();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (!form.code.trim()) throw new Error("Account code is required.");
      if (!form.name.trim()) throw new Error("Account name is required.");
      if (!form.group_id) throw new Error("Account group is required.");

      const res = await fetch("/api/accounts/chart-of-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.error || "Failed to save account.");
      }

      router.push("/accounts/chart-of-accounts");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Add New Account</h1>
        <p className="text-sm text-slate-500">
          Create a ledger account under the correct accounting group.
        </p>
      </div>

      <form
        onSubmit={save}
        className="max-w-3xl rounded-2xl border bg-white p-6 shadow-sm"
      >
        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Account Code
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
              placeholder="Example: 1001"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Account Name
            </label>
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
              placeholder="Example: Cash in Hand"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Account Group
            </label>
            <select
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
              value={form.group_id}
              onChange={(e) => setForm({ ...form, group_id: e.target.value })}
            >
              <option value="">Select Group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} — {g.type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Currency
            </label>
            <select
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
              value={form.currency_code}
              onChange={(e) => setForm({ ...form, currency_code: e.target.value })}
            >
              <option value="PKR">PKR</option>
              <option value="SAR">SAR</option>
              <option value="USD">USD</option>
              <option value="AED">AED</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-xl border bg-slate-50 p-4">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          <span className="text-sm font-medium text-slate-700">
            Account is active
          </span>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/accounts/chart-of-accounts")}
            className="rounded-xl border px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Account"}
          </button>
        </div>
      </form>
    </div>
  );
}