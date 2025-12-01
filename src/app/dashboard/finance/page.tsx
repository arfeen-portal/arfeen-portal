"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type KPI = {
  totalRevenue: number;
  netProfit: number;
  receivableAgents: number;
  payableSuppliers: number;
};

type TopAgent = {
  agent_id: string;
  agent_name: string | null;
  revenue: number;
};

export default function FinanceDashboardPage() {
  const supabase = createClient();

  const [kpi, setKpi] = useState<KPI | null>(null);
  const [topAgents, setTopAgents] = useState<TopAgent[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);

    // 1) net profit from trial balance view
    const { data: tb } = await supabase
      .from("acc_trial_balance_view")
      .select("account_type,balance_base");

    let totalRevenue = 0;
    let totalExpense = 0;

    (tb || []).forEach((r: any) => {
      const bal = Number(r.balance_base || 0);
      if (r.account_type === "income") totalRevenue += -bal;
      if (r.account_type === "expense") totalExpense += bal;
    });

    const netProfit = totalRevenue - totalExpense;

    // 2) receivable / payable from aging view
    const { data: aging } = await supabase
      .from("acc_aging_by_party_view")
      .select("party_type,total_balance_base");

    let recvAgents = 0;
    let paySuppliers = 0;

    (aging || []).forEach((r: any) => {
      const bal = Number(r.total_balance_base || 0);
      if (r.party_type === "agent") recvAgents += bal;
      if (r.party_type === "supplier") paySuppliers += bal;
    });

    setKpi({
      totalRevenue,
      netProfit,
      receivableAgents: recvAgents,
      payableSuppliers: paySuppliers,
    });

    // 3) Top agents by revenue (rough): use journal lines revenue accounts
    const { data: agentLines } = await supabase
      .from("acc_journal_entry_lines")
      .select(
        "party_id, party_type, credit, account:acc_accounts(code,group:acc_account_groups(type))"
      )
      .eq("party_type", "agent");

    const map = new Map<string, number>();

    (agentLines || []).forEach((l: any) => {
      const type =
        Array.isArray(l.account.group) && l.account.group[0]
          ? l.account.group[0].type
          : l.account.group?.type;

      if (type !== "income") return;
      const id = l.party_id as string;
      const value = Number(l.credit || 0);
      map.set(id, (map.get(id) || 0) + value);
    });

    const arr = Array.from(map.entries())
      .map(([agent_id, revenue]) => ({ agent_id, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // load names
    const ids = arr.map((a) => a.agent_id);
    const { data: agents } = await supabase
      .from("agents")
      .select("id,name")
      .in("id", ids);

    const withNames: TopAgent[] = arr.map((a) => ({
      agent_id: a.agent_id,
      revenue: a.revenue,
      agent_name: agents?.find((x) => x.id === a.agent_id)?.name || null,
    }));

    setTopAgents(withNames);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Finance Dashboard</h1>
          <p className="text-sm text-gray-500">
            Live KPIs from accounting module.
          </p>
        </div>
        <button
          onClick={load}
          className="px-3 py-2 text-xs sm:text-sm rounded border"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <p className="text-xs text-gray-400">Loading…</p>
      )}

      {/* KPI Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <KpiCard
          label="Total Revenue"
          value={kpi ? kpi.totalRevenue : 0}
        />
        <KpiCard
          label="Net Profit"
          value={kpi ? kpi.netProfit : 0}
        />
        <KpiCard
          label="Receivable – Agents"
          value={kpi ? kpi.receivableAgents : 0}
        />
        <KpiCard
          label="Payable – Suppliers"
          value={kpi ? kpi.payableSuppliers : 0}
        />
      </div>

      {/* Top Agents */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 text-sm font-semibold">
          Top Agents by Revenue
        </div>
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Agent</th>
              <th className="px-3 py-2 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {topAgents.map((a) => (
              <tr key={a.agent_id} className="border-t">
                <td className="px-3 py-2">
                  {a.agent_name || a.agent_id}
                </td>
                <td className="px-3 py-2 text-right">
                  {a.revenue.toFixed(2)}
                </td>
              </tr>
            ))}
            {!topAgents.length && !loading && (
              <tr>
                <td
                  colSpan={2}
                  className="px-3 py-6 text-center text-xs text-gray-400"
                >
                  No revenue data yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number }) {
  const positive = value >= 0;
  return (
    <div className="border rounded-xl p-4 shadow-sm bg-white">
      <div className="text-xs text-gray-500 uppercase mb-1">
        {label}
      </div>
      <div
        className={`text-xl font-semibold ${
          positive ? "text-green-600" : "text-red-600"
        }`}
      >
        {value.toFixed(2)}
      </div>
    </div>
  );
}
