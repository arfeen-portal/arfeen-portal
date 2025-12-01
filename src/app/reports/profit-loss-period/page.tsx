"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type PLRow = {
  accountCode: string;
  accountName: string;
  accountType: "income" | "expense" | string;
  amount: number; // debit - credit (sign ke sath)
};

export default function ProfitLossPeriodPage() {
  const supabase = createClient();

  const [rows, setRows] = useState<PLRow[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("acc_journal_entry_lines")
      .select(
        "debit,credit,account:acc_accounts(code,name,group:acc_account_groups(type)),journal_entry:acc_journal_entries(entry_date)"
      );

    if (error) {
      console.error(error);
      setRows([]);
      setLoading(false);
      return;
    }

    let list = (data || []) as any[];

    // date filter
    if (fromDate) {
      list = list.filter(
        (l) => l.journal_entry.entry_date >= fromDate
      );
    }
    if (toDate) {
      list = list.filter(
        (l) => l.journal_entry.entry_date <= toDate
      );
    }

    // aggregate by account
    const map = new Map<string, PLRow>();

    for (const raw of list) {
      const acc = raw.account || {};
      const group = acc.group;

      let type: string | undefined;
      if (Array.isArray(group)) {
        type = group[0]?.type;
      } else {
        type = group?.type;
      }

      const accountType = (type || "") as string;

      // sirf income / expense chahiye
      if (accountType !== "income" && accountType !== "expense") continue;

      const code = acc.code as string;
      const name = acc.name as string;

      const key = code;
      const amount =
        Number(raw.debit || 0) - Number(raw.credit || 0); // debit - credit

      if (!map.has(key)) {
        map.set(key, {
          accountCode: code,
          accountName: name,
          accountType,
          amount: 0,
        });
      }

      map.get(key)!.amount += amount;
    }

    const arr = Array.from(map.values()).sort((a, b) =>
      a.accountCode.localeCompare(b.accountCode)
    );

    setRows(arr);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const incomeRows = rows.filter((r) => r.accountType === "income");
  const expenseRows = rows.filter((r) => r.accountType === "expense");

  const totalIncome = incomeRows.reduce(
    (sum, r) => sum + r.amount * -1, // income usually credit (negative balance)
    0
  );
  const totalExpense = expenseRows.reduce(
    (sum, r) => sum + r.amount,
    0
  );
  const netProfit = totalIncome - totalExpense;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            Profit &amp; Loss (By Period)
          </h1>
          <p className="text-sm text-gray-500">
            Data via <code>acc_journal_entry_lines</code>.
          </p>
        </div>
        <div className="flex gap-2">
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

      <div className="grid md:grid-cols-2 gap-6">
        {/* Income */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 font-semibold text-sm">
            Income
          </div>
          <table className="min-w-full text-xs sm:text-sm">
            <tbody>
              {incomeRows.map((r) => (
                <tr key={r.accountCode} className="border-t">
                  <td className="px-3 py-2">
                    {r.accountCode} – {r.accountName}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {(r.amount * -1).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-3 py-2 font-semibold">Total Income</td>
                <td className="px-3 py-2 text-right font-semibold">
                  {totalIncome.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Expenses */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 font-semibold text-sm">
            Expenses
          </div>
          <table className="min-w-full text-xs sm:text-sm">
            <tbody>
              {expenseRows.map((r) => (
                <tr key={r.accountCode} className="border-t">
                  <td className="px-3 py-2">
                    {r.accountCode} – {r.accountName}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {r.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-3 py-2 font-semibold">Total Expenses</td>
                <td className="px-3 py-2 text-right font-semibold">
                  {totalExpense.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="text-right">
        <span className="text-xs uppercase text-gray-500">
          Net Profit / (Loss)
        </span>
        <div
          className={`text-xl font-semibold ${
            netProfit >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {netProfit.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
