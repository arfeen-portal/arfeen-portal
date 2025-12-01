"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Row = {
  account_code: string;
  account_name: string;
  account_type: string;
  balance_base: number | null;
};

export default function BalanceSheetPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let { data, error } = await supabase
        .from("acc_trial_balance_view")
        .select(
          "account_code,account_name,account_type,balance_base"
        );

      if (error) {
        console.error(error);
        data = [];
      }
      setRows((data || []) as Row[]);
      setLoading(false);
    };

    load();
  }, [supabase]);

  const assets = rows.filter((r) => r.account_type === "asset");
  const liabilities = rows.filter((r) => r.account_type === "liability");
  const equity = rows.filter((r) => r.account_type === "equity");

  const totalAssets = assets.reduce(
    (sum, r) => sum + Number(r.balance_base || 0),
    0
  );
  const totalLiab = liabilities.reduce(
    (sum, r) => sum + Number(r.balance_base || 0) * -1,
    0
  );
  const totalEquity = equity.reduce(
    (sum, r) => sum + Number(r.balance_base || 0) * -1,
    0
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Balance Sheet</h1>
          <p className="text-sm text-gray-500">
            Based on <code>acc_trial_balance_view</code>.
          </p>
        </div>
        <div className="text-right text-xs text-gray-500">
          Assets = Liabilities + Equity (check manually for now)
        </div>
      </div>

      {loading && (
        <p className="text-xs text-gray-400">Loading…</p>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Assets */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 font-semibold text-sm">
            Assets
          </div>
          <table className="min-w-full text-xs sm:text-sm">
            <tbody>
              {assets.map((r) => (
                <tr key={r.account_code} className="border-t">
                  <td className="px-3 py-2">
                    {r.account_code} – {r.account_name}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {Number(r.balance_base || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-3 py-2 font-semibold">
                  Total Assets
                </td>
                <td className="px-3 py-2 text-right font-semibold">
                  {totalAssets.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Liabilities & Equity */}
        <div className="space-y-4">
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 font-semibold text-sm">
              Liabilities
            </div>
            <table className="min-w-full text-xs sm:text-sm">
              <tbody>
                {liabilities.map((r) => (
                  <tr key={r.account_code} className="border-t">
                    <td className="px-3 py-2">
                      {r.account_code} – {r.account_name}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {(Number(r.balance_base || 0) * -1).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-3 py-2 font-semibold">
                    Total Liabilities
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {totalLiab.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 font-semibold text-sm">
              Equity
            </div>
            <table className="min-w-full text-xs sm:text-sm">
              <tbody>
                {equity.map((r) => (
                  <tr key={r.account_code} className="border-t">
                    <td className="px-3 py-2">
                      {r.account_code} – {r.account_name}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {(Number(r.balance_base || 0) * -1).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-3 py-2 font-semibold">
                    Total Equity
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {totalEquity.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
