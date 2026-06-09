"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AccountRow = {
  id: string;
  code: string;
  name: string;
  group_id: string | null;
  currency_code?: string | null;
  is_active: boolean;
  group?: {
    id: string;
    name: string;
    type: string;
  } | null;
};

export default function ChartOfAccountsPage() {
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  async function loadAccounts() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `/api/accounts/chart-of-accounts?search=${encodeURIComponent(search)}`,
        { cache: "no-store" }
      );

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.error || "Failed to load chart of accounts.");
      }

      setRows(json.rows || []);
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(loadAccounts, 300);
    return () => clearTimeout(t);
  }, [search]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      active: rows.filter((r) => r.is_active).length,
      inactive: rows.filter((r) => !r.is_active).length,
      assets: rows.filter((r) => r.group?.type?.toLowerCase() === "asset").length,
      liabilities: rows.filter((r) => r.group?.type?.toLowerCase() === "liability").length,
      income: rows.filter((r) => r.group?.type?.toLowerCase() === "income").length,
      expense: rows.filter((r) => r.group?.type?.toLowerCase() === "expense").length,
    };
  }, [rows]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Chart of Accounts</h1>
          <p className="text-sm text-slate-500">
            Manage ledger accounts, account groups, status, and currency.
          </p>
        </div>

        <Link
          href="/accounts/chart-of-accounts/new"
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
        >
          + Add Account
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
        <Stat title="Total" value={stats.total} />
        <Stat title="Active" value={stats.active} />
        <Stat title="Inactive" value={stats.inactive} />
        <Stat title="Assets" value={stats.assets} />
        <Stat title="Liabilities" value={stats.liabilities} />
        <Stat title="Income" value={stats.income} />
        <Stat title="Expense" value={stats.expense} />
      </div>

      <div className="mb-4 rounded-2xl border bg-white p-4 shadow-sm">
        <input
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
          placeholder="Search by account code or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-sm">
            <thead className="border-b bg-slate-100 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-4 text-left">Code</th>
                <th className="p-4 text-left">Account Name</th>
                <th className="p-4 text-left">Group</th>
                <th className="p-4 text-left">Type</th>
                <th className="p-4 text-left">Currency</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Loading accounts...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No accounts found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-slate-50">
                    <td className="p-4 font-mono font-semibold text-slate-700">{r.code}</td>
                    <td className="p-4 font-medium text-slate-900">{r.name}</td>
                    <td className="p-4 text-slate-600">{r.group?.name || "-"}</td>
                    <td className="p-4 capitalize text-slate-600">{r.group?.type || "-"}</td>
                    <td className="p-4 text-slate-600">{r.currency_code || "PKR"}</td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          r.is_active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {r.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/accounts/chart-of-accounts/${r.id}/edit`}
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}