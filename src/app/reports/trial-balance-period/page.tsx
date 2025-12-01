"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Row = {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  total_debit: number;
  total_credit: number;
};

export default function TrialBalancePeriodPage() {
  const supabase = createClient();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const load = async () => {
    setLoading(true);

    let { data, error } = await supabase
      .from("acc_journal_entry_lines")
      .select(
        "debit,credit,account:acc_accounts(id,code,name,group:acc_account_groups(type)) , journal_entry:acc_journal_entries(entry_date)"
      );

    if (error) {
      console.error(error);
      setRows([]);
      setLoading(false);
      return;
    }

    let list = (data || []) as any[];

    if (fromDate) {
      list = list.filter(
        (r) => r.journal_entry.entry_date >= fromDate
      );
    }
    if (toDate) {
      list = list.filter(
        (r) => r.journal_entry.entry_date <= toDate
      );
    }

    // group by account
    const map = new Map<string, Row>();
    for (const r of list) {
      const accId = r.account.id as string;
      if (!map.has(accId)) {
        map.set(accId, {
          account_id: accId,
          account_code: r.account.code,
          account_name: r.account.name,
          account_type: r.account.group.type,
          total_debit: 0,
          total_credit: 0,
        });
      }
      const row = map.get(accId)!;
      row.total_debit += Number(r.debit || 0);
      row.total_credit += Number(r.credit || 0);
    }

    let arr = Array.from(map.values()).sort((a, b) =>
      a.account_code.localeCompare(b.account_code)
    );

    if (typeFilter) {
      arr = arr.filter((r) => r.account_type === typeFilter);
    }

    setRows(arr);
    setLoading(false);
  };

  useEffect(() => {
    // initial load (all-time)
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = rows.reduce(
    (acc, r) => {
      acc.debit += r.total_debit;
      acc.credit += r.total_credit;
      return acc;
    },
    { debit: 0, credit: 0 }
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap gap-3 items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Trial Balance (By Period)</h1>
          <p className="text-sm text-gray-500">
            Filters <code>acc_journal_entry_lines</code> by entry date.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div>
            <label className="block text-xs mb-1">From</label>
            <input
              type="date"
              className="border rounded px-2 py-1 text-sm"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs mb-1">To</label>
            <input
              type="date"
              className="border rounded px-2 py-1 text-sm"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Type</label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="asset">Assets</option>
              <option value="liability">Liabilities</option>
              <option value="equity">Equity</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
            </select>
          </div>
          <button
            type="button"
            onClick={load}
            className="h-9 px-3 text-sm rounded bg-blue-600 text-white self-end"
          >
            Apply
          </button>
        </div>
      </div>

      {loading && (
        <p className="text-xs text-gray-400">Loading…</p>
      )}

      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Code</th>
              <th className="px-3 py-2 text-left">Account</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-right">Debit</th>
              <th className="px-3 py-2 text-right">Credit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.account_id} className="border-t">
                <td className="px-3 py-2">{r.account_code}</td>
                <td className="px-3 py-2">{r.account_name}</td>
                <td className="px-3 py-2 capitalize">{r.account_type}</td>
                <td className="px-3 py-2 text-right">
                  {r.total_debit.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right">
                  {r.total_credit.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-3 py-2 font-semibold" colSpan={3}>
                Totals
              </td>
              <td className="px-3 py-2 text-right font-semibold">
                {totals.debit.toFixed(2)}
              </td>
              <td className="px-3 py-2 text-right font-semibold">
                {totals.credit.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
