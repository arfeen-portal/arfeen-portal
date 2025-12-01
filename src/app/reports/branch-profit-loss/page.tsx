"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Row = {
  branch_id: string | null;
  account_type: string;
  account_code: string;
  account_name: string;
  total_debit: number;
  total_credit: number;
};

type Branch = {
  id: string;
  code: string;
  name: string;
};

export default function BranchPLPage() {
  const supabase = createClient();

  const [branchId, setBranchId] = useState<string>("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadBranches = async () => {
      const { data } = await supabase
        .from("branches")
        .select("id,code,name")
        .order("code");
      setBranches((data || []) as Branch[]);
    };
    loadBranches();
  }, [supabase]);

  const load = async () => {
    setLoading(true);
    let query = supabase.from("acc_branch_pl_view").select("*");
    if (branchId) query = query.eq("branch_id", branchId);
    const { data, error } = await query;
    if (error) {
      console.error(error);
      setRows([]);
    } else {
      setRows((data || []) as Row[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const income = rows.filter((r) => r.account_type === "income");
  const expenses = rows.filter((r) => r.account_type === "expense");

  const totalIncome = income.reduce(
    (sum, r) => sum + (r.total_credit - r.total_debit),
    0
  );
  const totalExpense = expenses.reduce(
    (sum, r) => sum + (r.total_debit - r.total_credit),
    0
  );
  const net = totalIncome - totalExpense;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            Branch Profit &amp; Loss
          </h1>
          <p className="text-sm text-gray-500">
            Per-branch breakdown from <code>acc_branch_pl_view</code>.
          </p>
        </div>
        <div className="flex gap-2">
          <select
            className="border rounded px-3 py-2 text-sm"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
          >
            <option value="">All branches (consolidated)</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.code} – {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <p className="text-xs text-gray-400">Loading…</p>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 text-sm font-semibold">
            Income
          </div>
          <table className="min-w-full text-xs sm:text-sm">
            <tbody>
              {income.map((r) => (
                <tr key={r.account_code} className="border-t">
                  <td className="px-3 py-2">
                    {r.account_code} – {r.account_name}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {(r.total_credit - r.total_debit).toFixed(2)}
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

        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 text-sm font-semibold">
            Expenses
          </div>
          <table className="min-w-full text-xs sm:text-sm">
            <tbody>
              {expenses.map((r) => (
                <tr key={r.account_code} className="border-t">
                  <td className="px-3 py-2">
                    {r.account_code} – {r.account_name}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {(r.total_debit - r.total_credit).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-3 py-2 font-semibold">
                  Total Expenses
                </td>
                <td className="px-3 py-2 text-right font-semibold">
                  {totalExpense.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="text-right">
        <span className="text-xs text-gray-500 uppercase">
          Net Profit / (Loss)
        </span>
        <div
          className={`text-xl font-semibold ${
            net >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {net.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
