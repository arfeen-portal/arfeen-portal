"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState, useCallback, useMemo } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

type GroupRow = { id: string; name: string; type: string };

export default function EditAccountPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = String(params?.id || "");

  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createdAt, setCreatedAt] = useState("");

  const [form, setForm] = useState({
    code: "",
    name: "",
    group_id: "",
    currency_code: "PKR",
    is_active: true,
  });

  const selectedGroupType = useMemo(() => {
    return groups.find((g) => g.id === form.group_id)?.type || "";
  }, [groups, form.group_id]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [accountRes, groupsRes] = await Promise.all([
        fetch(`/api/accounts/chart-of-accounts/${id}`, { cache: "no-store" }),
        supabaseClient
          .from("acc_account_groups")
          .select("id,name,type")
          .order("type", { ascending: true })
          .order("name", { ascending: true }),
      ]);

      const accountJson = await accountRes.json();
      if (!accountJson.ok) throw new Error(accountJson.error || "Failed to load.");

      setForm({
        code: accountJson.row?.code || "",
        name: accountJson.row?.name || "",
        group_id: accountJson.row?.group_id || "",
        currency_code: accountJson.row?.currency_code || "PKR",
        is_active: accountJson.row?.is_active ?? true,
      });
      setCreatedAt(accountJson.row?.created_at || "");
      setGroups(groupsRes.data || []);
    } catch (err: any) {
      setError(err?.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { if (id) loadData(); }, [id, loadData]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.group_id) {
        setError("Please select an Account Group.");
        return;
    }
    if (!form.is_active && !window.confirm("Warning: Deactivating will hide this account from ledgers. Proceed?")) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/accounts/chart-of-accounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to update account.");
      
      router.push("/accounts/chart-of-accounts");
      router.refresh(); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Edit Account</h1>
            <p className="text-xs text-slate-400">
              Created: {createdAt ? new Date(createdAt).toLocaleDateString() : "-"}
            </p>
          </div>
          <Link href="/accounts/chart-of-accounts" className="text-sm font-semibold underline text-slate-600">Back</Link>
        </div>

        <form onSubmit={onSubmit} className="bg-white p-6 rounded-2xl border shadow-sm space-y-5">
          {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl">{error}</div>}
          
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold mb-2">Code</label>
              <input required value={form.code} onChange={(e) => setForm({...form, code: e.target.value})} className="w-full p-3 border rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Name</label>
              <input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full p-3 border rounded-xl" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Account Group</label>
            <select required value={form.group_id} onChange={(e) => setForm({...form, group_id: e.target.value})} className="w-full p-3 border rounded-xl">
              <option value="">Select Account Group</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.type})
                </option>
              ))}
            </select>
            {selectedGroupType && (
              <p className="mt-2 text-xs font-bold uppercase tracking-widest text-blue-600">
                Type: {selectedGroupType}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Currency</label>
            <select value={form.currency_code} onChange={(e) => setForm({...form, currency_code: e.target.value})} className="w-full p-3 border rounded-xl">
              {["PKR", "SAR", "USD", "AED"].map((currency) => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl font-medium text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({...form, is_active: e.target.checked})} className="h-4 w-4" />
            <span className={form.is_active ? "text-emerald-700" : "text-red-600"}>
              Status: {form.is_active ? "Active Account" : "Inactive Account"}
            </span>
          </label>

          <button type="submit" disabled={saving} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800">
            {saving ? "Saving..." : "Update Account"}
          </button>
        </form>
      </div>
    </div>
  );
}