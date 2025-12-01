"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Row = {
  account_id: string;
  account_code: string;
  account_name: string;
  balance_base: number | null;
};

export default function CashBankReportPage() {
  const supabase = createClient();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      let { data, error } = await supabase
        .from("acc_cash_bank_summary_view")
        .select("*")
        .order("account_code", { ascending: true });

      if (error) {
        console.error("Cash/bank error", error);
        data = [];
      }

      setRows((data || []) as Row[]);
      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const total = rows.reduce(
    (sum, r) => sum + Number(r.balance_base || 0),
    0
  );

  const handleExport = () => {
    const header = ["Account Code", "Account Name", "Balance"].join(",");

    const lines = rows.map((r) =>
      [
        r.account_code,
        `"${r.account_name}"`,
        Number(r.balance_base || 0).toFixed(2),
      ].join(",")
    );

    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cash-bank-summary.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Cash &amp; Bank Summary</h1>
          <p className="text-sm text-gray-500">
            From <code>acc_cash_bank_summary_view</code>.
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

      {loading && (
        <div className="text-xs text-gray-400">Loading cash &amp; bank…</div>
      )}

      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Account Code</th>
              <th className="px-3 py-2 text-left font-semibold">Account Name</th>
              <th className="px-3 py-2 text-right font-semibold">Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.account_id} className="border-t">
                <td className="px-3 py-2">{r.account_code}</td>
                <td className="px-3 py-2">{r.account_name}</td>
                <td className="px-3 py-2 text-right">
                  {Number(r.balance_base || 0).toFixed(2)}
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-6 text-center text-xs text-gray-400"
                >
                  No cash/bank accounts found.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-3 py-2 font-semibold" colSpan={2}>
                Total
              </td>
              <td className="px-3 py-2 text-right font-semibold text-blue-700">
                {total.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
