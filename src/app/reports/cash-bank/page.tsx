"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

type Row = {
  account_id: string;
  account_code: string;
  account_name: string;
  balance_base: number | null;
};

export default function CashBankReportPage() {
  const supabase = supabaseClient;

  if (!supabase) {
    throw new Error("Supabase not initialized");
  }

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("acc_cash_bank_summary_view")
        .select("*")
        .order("account_code", { ascending: true });

      if (error) {
        console.error("Cash/bank error:", error);
        setRows([]);
      } else {
        setRows(data ?? []);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const total = rows.reduce(
    (sum, r) => sum + Number(r.balance_base || 0),
    0
  );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">
        Cash & Bank Summary
      </h1>

      {loading && (
        <div className="text-gray-400">
          Loading cash & bank...
        </div>
      )}

      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Account Code</th>
              <th className="px-3 py-2 text-left">Account Name</th>
              <th className="px-3 py-2 text-right">Balance</th>
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
                <td colSpan={3} className="px-3 py-6 text-center text-gray-400">
                  No cash/bank accounts found.
                </td>
              </tr>
            )}
          </tbody>

          <tfoot className="bg-gray-50 border-t">
            <tr>
              <td colSpan={2} className="px-3 py-2 font-semibold">
                Total
              </td>
              <td className="px-3 py-2 text-right font-semibold">
                {total.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}