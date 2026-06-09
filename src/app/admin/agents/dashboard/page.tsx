"use client";

import { useEffect, useMemo, useState } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AgentDashboardRow = {
  agent_id: string;
  tenant_id: string;
  agent_name: string;
  agent_code: string | null;
  city: string | null;
  country: string | null;
  status: string | null;
  total_commission_entries: number;
  gross_sales: number;
  total_commission: number;
  paid_commission: number;
  pending_commission: number;
  credit_limit: number;
  outstanding_balance: number;
  is_credit_blocked: boolean;
};

type DashboardResponse = {
  ok: boolean;
  summary: {
    total_agents: number;
    active_agents: number;
    blocked_agents: number;
    total_gross_sales: number;
    total_commission: number;
    pending_commission: number;
    total_outstanding: number;
    total_credit_limit: number;
  };
  rows: AgentDashboardRow[];
  topAgents: AgentDashboardRow[];
  error?: string;
};

function money(value: number) {
  return new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function AgentDashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      const res = await fetch("/api/agents/dashboard", { cache: "no-store" });
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredRows = useMemo(() => {
    const rows = data?.rows ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((row) =>
      [row.agent_name, row.agent_code, row.city, row.country, row.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [data?.rows, search]);

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Agents</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Agent Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Sales, commissions, outstanding balances and credit risk in one place.
            </p>
          </div>

          <div className="w-full max-w-md">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Search agent
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, code, city, country..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ring-0 transition focus:border-blue-400 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Loading dashboard...
        </div>
      ) : data?.ok === false ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
          {data.error || "Failed to load dashboard"}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card title="Total Agents" value={money(data?.summary.total_agents || 0)} />
            <Card title="Active Agents" value={money(data?.summary.active_agents || 0)} />
            <Card title="Total Gross Sales" value={`PKR ${money(data?.summary.total_gross_sales || 0)}`} />
            <Card title="Total Commission" value={`PKR ${money(data?.summary.total_commission || 0)}`} />
            <Card title="Pending Commission" value={`PKR ${money(data?.summary.pending_commission || 0)}`} />
            <Card title="Outstanding Balance" value={`PKR ${money(data?.summary.total_outstanding || 0)}`} />
            <Card title="Credit Limit" value={`PKR ${money(data?.summary.total_credit_limit || 0)}`} />
            <Card title="Blocked Agents" value={money(data?.summary.blocked_agents || 0)} />
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="text-lg font-semibold text-slate-900">Agent Performance</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Agent</th>
                      <th className="px-6 py-4 font-semibold">Gross Sales</th>
                      <th className="px-6 py-4 font-semibold">Commission</th>
                      <th className="px-6 py-4 font-semibold">Outstanding</th>
                      <th className="px-6 py-4 font-semibold">Limit</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr key={row.agent_id} className="border-t border-slate-100">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{row.agent_name}</div>
                          <div className="text-xs text-slate-500">
                            {row.agent_code || "—"} • {row.city || "—"}, {row.country || "—"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700">PKR {money(row.gross_sales)}</td>
                        <td className="px-6 py-4 text-slate-700">PKR {money(row.total_commission)}</td>
                        <td className="px-6 py-4 text-slate-700">PKR {money(row.outstanding_balance)}</td>
                        <td className="px-6 py-4 text-slate-700">PKR {money(row.credit_limit)}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              row.is_credit_blocked
                                ? "bg-red-100 text-red-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {row.is_credit_blocked ? "Blocked" : "Open"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredRows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                          No agents found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="text-lg font-semibold text-slate-900">Top Agents</h2>
              </div>
              <div className="space-y-4 p-6">
                {(data?.topAgents || []).map((agent) => (
                  <div
                    key={agent.agent_id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{agent.agent_name}</p>
                        <p className="text-xs text-slate-500">{agent.agent_code || "—"}</p>
                      </div>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        PKR {money(agent.gross_sales)}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-600">
                      <div className="rounded-xl bg-white p-3">
                        <div className="text-slate-400">Commission</div>
                        <div className="mt-1 font-semibold text-slate-800">
                          PKR {money(agent.total_commission)}
                        </div>
                      </div>
                      <div className="rounded-xl bg-white p-3">
                        <div className="text-slate-400">Outstanding</div>
                        <div className="mt-1 font-semibold text-slate-800">
                          PKR {money(agent.outstanding_balance)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {(data?.topAgents || []).length === 0 && (
                  <p className="text-sm text-slate-500">No agent performance data yet.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}