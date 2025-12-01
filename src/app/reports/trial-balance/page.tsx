"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Row = {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  group_name: string | null;
  total_debit_base: number | null;
  total_credit_base: number | null;
  balance_base: number | null;
};

export default function TrialBalancePage() {
  const supabase = createClient();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      let { data, error } = await supabase
        .from("acc_trial_balance_view")
        .select("*");

      if (error) {
        console.error("Trial balance error", error);
        data = [];
      }

      let list = (data || []) as Row[];

      if (typeFilter) {
        list = list.filter((r) => r.account_type === typeFilter);
      }

      if (search.trim()) {
        const s = search.trim().toLowerCase();
        list = list.filter(
          (r) =>
            r.account_name.toLowerCase().includes(s) ||
            r.account_code.toLowerCase().includes(s)
        );
      }

      setRows(list);
      setLoading(false);
    };

    fetchData();
  }, [supabase, typeFilter, search]);

  const totals = rows.reduce(
    (acc, r) => {
      acc.debit += Number(r.total_debit_base || 0);
      acc.credit += Number(r.total_credit_base || 0);
      return acc;
    },
    { debit: 0, credit: 0 }
  );

  const handleExport = () => {
    const header = [
      "Account Code",
      "Account Name",
      "Type",
      "Group",
      "Total Debit",
      "Total Credit",
      "Balance",
    ].join(",");

    const lines = rows.map((r) =>
      [
        r.account_code,
        `"${r.account_name}"`,
        r.account_type,
        r.group_name ?? "",
        Number(r.total_debit_base || 0).toFixed(2),
        Number(r.total_credit_base || 0).toFixed(2),
        Number(r.balance_base || 0).toFixed(2),
      ].join(",")
    );

    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trial-balance.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Trial Balance</h1>
          <p className="text-sm text-gray-500">
            From <code>acc_trial_balance_view</code> (all dates combined).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-3 py-2 text-xs sm:text-sm rounded border"
          >
            Print
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-2 text-xs sm:text-sm rounded border"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          className="border rounded px-3 py-2 text-sm"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="asset">Assets</option>
          <option value="liability">Liabilities</option>
          <option value="equity">Equity</option>
          <option value="income">Income</option>
          <option value="expense">Expenses</option>
        </select>
        <input
          className="border rounded px-3 py-2 text-sm min-w-[200px]"
          placeholder="Search account code / name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {loading && (
          <span className="text-xs text-gray-400 self-center">Loading…</span>
        )}
      </div>

      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Code</th>
              <th className="px-3 py-2 text-left font-semibold">Account Name</th>
              <th className="px-3 py-2 text-left font-semibold">Type</th>
              <th className="px-3 py-2 text-left font-semibold">Group</th>
              <th className="px-3 py-2 text-right font-semibold">Debit</th>
              <th className="px-3 py-2 text-right font-semibold">Credit</th>
              <th className="px-3 py-2 text-right font-semibold">Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.account_id} className="border-t">
                <td className="px-3 py-2">{r.account_code}</td>
                <td className="px-3 py-2">{r.account_name}</td>
                <td className="px-3 py-2 capitalize">{r.account_type}</td>
                <td className="px-3 py-2">{r.group_name ?? "-"}</td>
                <td className="px-3 py-2 text-right">
                  {Number(r.total_debit_base || 0).toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right">
                  {Number(r.total_credit_base || 0).toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right">
                  {Number(r.balance_base || 0).toFixed(2)}
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-6 text-center text-xs text-gray-400"
                >
                  No data.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-3 py-2 font-semibold" colSpan={4}>
                Total
              </td>
              <td className="px-3 py-2 text-right font-semibold">
                {totals.debit.toFixed(2)}
              </td>
              <td className="px-3 py-2 text-right font-semibold">
                {totals.credit.toFixed(2)}
              </td>
              <td className="px-3 py-2 text-right font-semibold text-blue-700">
                {(totals.debit - totals.credit).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
