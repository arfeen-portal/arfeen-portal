"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";

type LedgerSummary = {
  total_debit: number;
  total_credit: number;
  net_profit: number;
};

type MonthlyRow = {
  month_label: string;
  debit: number;
  credit: number;
};

export default function AccountingSummary() {
  const supabase = createClient();
  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);

  const loadSummary = async () => {
    const { data: sumData } = await supabase.rpc("ledger_global_summary");
    if (sumData && sumData[0]) {
      setSummary(sumData[0] as LedgerSummary);
    }

    const { data: monthlyData } = await supabase.rpc("ledger_monthly_summary");
    setMonthly((monthlyData as MonthlyRow[]) || []);
  };

  useEffect(() => {
    loadSummary();
  }, []);

  if (!summary)
    return <div className="p-6">Loading accounting summary...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Accounting & Ledger</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border rounded shadow">
          <p className="text-gray-500 text-sm">Total Debit</p>
          <p className="text-2xl font-bold text-red-600">
            {summary.total_debit.toLocaleString()} SAR
          </p>
        </div>
        <div className="p-4 bg-white border rounded shadow">
          <p className="text-gray-500 text-sm">Total Credit</p>
          <p className="text-2xl font-bold text-green-600">
            {summary.total_credit.toLocaleString()} SAR
          </p>
        </div>
        <div className="p-4 bg-white border rounded shadow">
          <p className="text-gray-500 text-sm">Net Profit</p>
          <p className="text-2xl font-bold text-blue-600">
            {summary.net_profit.toLocaleString()} SAR
          </p>
        </div>
      </div>

      <div className="p-5 bg-white border rounded shadow">
        <h2 className="text-lg font-bold mb-3">Monthly Debit vs Credit</h2>
        <Bar
          data={{
            labels: monthly.map((m) => m.month_label),
            datasets: [
              {
                label: "Debit",
                data: monthly.map((m) => m.debit),
              },
              {
                label: "Credit",
                data: monthly.map((m) => m.credit),
              },
            ],
          }}
        />
      </div>
    </div>
  );
}
