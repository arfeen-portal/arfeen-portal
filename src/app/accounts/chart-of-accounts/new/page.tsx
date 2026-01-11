"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
export const dynamic = "force-dynamic";

type Group = {
  id: string;
  name: string;
  type: string;
  code: string;
};

export default function NewAccountPage() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const router = useRouter();

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [currency, setCurrency] = useState("SAR");
  const [isActive, setIsActive] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("acc_account_groups")
        .select("id,name,type,code")
        .order("code", { ascending: true });

      if (error) {
        console.error("groups error", error);
        setGroups([]);
      } else {
        setGroups((data || []) as Group[]);
      }
      setLoading(false);
    };

    fetchGroups();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    if (!code.trim() || !name.trim() || !groupId) {
      setErrorMsg("Code, Name and Group are required.");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("acc_accounts").insert({
      code: code.trim(),
      name: name.trim(),
      group_id: groupId,
      currency_code: currency,
      is_active: isActive,
    });

    if (error) {
      console.error("insert account error", error);
      setErrorMsg(error.message);
      setSaving(false);
      return;
    }

    router.push("/accounts/chart-of-accounts");
  };

  return (
    <div className="p-6 max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Add New Account</h1>
        <p className="text-sm text-gray-500">
          Create a new ledger account in your chart of accounts.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold mb-1">
              Account Code
            </label>
            <input
              className="border rounded px-3 py-2 text-sm w-full"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. 1010"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold mb-1">
              Currency
            </label>
            <input
              className="border rounded px-3 py-2 text-sm w-full"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">
            Account Name
          </label>
          <input
            className="border rounded px-3 py-2 text-sm w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Cash in Hand - Head Office"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">
            Account Group
          </label>
          <select
            className="border rounded px-3 py-2 text-sm w-full"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          >
            <option value="">Select group...</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.code} – {g.name} ({g.type})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="isActive"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label htmlFor="isActive" className="text-sm">
            Active account
          </label>
        </div>

        {loading && (
          <p className="text-xs text-gray-400">Loading groups…</p>
        )}
        {errorMsg && (
          <p className="text-xs text-red-500">{errorMsg}</p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Account"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm rounded border"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
