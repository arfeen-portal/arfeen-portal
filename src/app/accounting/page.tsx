"use client";

import { useEffect, useState, useMemo } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import PageHeader from "@/components/layout/PageHeader";
import { Bar } from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

export default function AccountingPage() {
  const supabase = useMemo(() => getSupabaseClient(), []);

  const [global, setGlobal] = useState<any>(null);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const g = await supabase.rpc("ledger_global_summary");
      const m = await supabase.rpc("ledger_monthly_summary");
      const a = await supabase.rpc("ledger_agent_summary");

      setGlobal(g.data || null);
      setMonthly(m.data || []);
      setAgents(a.data || []);
    };

    loadData();
  }, [supabase]);

  if (!global) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Accounting Dashboard"
        subtitle="View revenue, expenses & profit analytics"
      />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-slate-500">Total Debit</p>
          <p className="text-xl font-semibold">{global.total_debit} SAR</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-slate-500">Total Credit</p>
          <p className="text-xl font-semibold">{global.total_credit} SAR</p>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <p className="text-sm text-slate-500">Net Profit</p>
          <p className="text-xl font-semibold">{global.net_profit} SAR</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-5 rounded shadow">
        <h2 className="font-semibold mb-3">Monthly Debit vs Credit</h2>
        <Bar
          data={{
            labels: monthly.map((m) => m.month_label),
            datasets: [
              { label: "Debit", data: monthly.map((m) => m.debit) },
              { label: "Credit", data: monthly.map((m) => m.credit) },
            ],
          }}
        />
      </div>

      {/* Agent table */}
      <div className="bg-white p-5 rounded shadow">
        <h2 className="font-semibold mb-3">Agent-wise Profit</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th>Agent</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Profit</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a) => (
              <tr key={a.agent_id} className="border-b">
                <td>{a.agent_name}</td>
                <td>{a.total_debit}</td>
                <td>{a.total_credit}</td>
                <td className="font-semibold">{a.net_profit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
