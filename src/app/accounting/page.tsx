"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import PageHeader from "@/components/layout/PageHeader";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AccountingPage() {
  const supabase = getSupabaseClient();

  const [global, setGlobal] = useState<any>(null);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);

  const loadData = async () => {
    const g = await supabase.rpc("ledger_global_summary");
    const m = await supabase.rpc("ledger_monthly_summary");
    const a = await supabase.rpc("ledger_agent_summary");

    setGlobal(g.data?.[0]);
    setMonthly(m.data || []);
    setAgents(a.data || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!global) return <div className="p-6">Loading…</div>;

  return (
    <div>
      <PageHeader
        title="Accounting Dashboard"
        subtitle="View revenue, expenses & profit analytics"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white border rounded shadow">
          <p className="text-xs text-slate-500">Total Debit</p>
          <p className="text-xl font-semibold text-red-600">
            {global.total_debit} SAR
          </p>
        </div>
        <div className="p-4 bg-white border rounded shadow">
          <p className="text-xs text-slate-500">Total Credit</p>
          <p className="text-xl font-semibold text-green-600">
            {global.total_credit} SAR
          </p>
        </div>
        <div className="p-4 bg-white border rounded shadow">
          <p className="text-xs text-slate-500">Net Profit</p>
          <p className="text-xl font-semibold text-blue-600">
            {global.net_profit} SAR
          </p>
        </div>
      </div>

      {/* Monthly chart */}
      <div className="p-5 bg-white border rounded shadow mb-6">
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

      {/* Agent summary */}
      <div className="p-5 bg-white border rounded shadow">
        <h2 className="font-semibold mb-3">Agent-wise Profit</h2>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Agent</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Profit</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a) => (
              <tr key={a.agent_id} className="border-b">
                <td className="py-2">{a.agent_name}</td>
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
