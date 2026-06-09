"use client";

import { useEffect, useMemo, useState } from "react";

type Trend = "up" | "down" | "stable";

type DNA = {
  agent_id: string;
  agent_name: string;
  agent_code: string;
  status: string;
  is_active: boolean;
  is_credit_blocked: boolean;
  primary_route: string;
  total_bookings: number;
  total_sales: number;
  payment_discipline: number;
  refund_behavior: number;
  booking_habits: number;
  seasonal_performance: number;
  fraud_probability: number;
  negotiation_pattern: number;
  growth_potential: number;
  churn_risk: number;
  projected_revenue_impact: number;
  trend: Trend;
  overall_score: number;
  risk_level: string;
  ai_summary: string;
};

type RouteRisk = {
  route: string;
  total_bookings: number;
  risky_agents_count: number;
  total_revenue: number;
  route_risk_score: number;
  alert: string;
};

type ApiResponse = {
  ok: boolean;
  summary: {
    total_agents: number;
    risky_agents: number;
    churn_risk_agents: number;
    growth_agents: number;
    projected_loss_30_days: number;
    avg_overall_score: number;
  };
  dna: DNA[];
  route_risk_map: RouteRisk[];
  signals: any[];
  error?: string;
};

function badgeClass(level: string) {
  if (level === "critical") return "bg-red-500/15 text-red-300 border-red-500/30";
  if (level === "high") return "bg-orange-500/15 text-orange-300 border-orange-500/30";
  if (level === "medium") return "bg-yellow-500/15 text-yellow-300 border-yellow-500/30";
  return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
}

function trendLabel(t: Trend) {
  if (t === "up") return "↑ Growth";
  if (t === "down") return "↓ Dropping";
  return "→ Stable";
}

function Bar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
      <div
        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-amber-400"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export default function AiFinancialHealthPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState("all");

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/api/accounts/ai-financial-health", {
        cache: "no-store",
      });
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setData({
        ok: false,
        error: e?.message || "Failed to load",
        summary: {
          total_agents: 0,
          risky_agents: 0,
          churn_risk_agents: 0,
          growth_agents: 0,
          projected_loss_30_days: 0,
          avg_overall_score: 0,
        },
        dna: [],
        route_risk_map: [],
        signals: [],
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function runAgentAction(agentId: string, action: string) {
    try {
      setActionLoading(agentId + action);

      const res = await fetch("/api/accounts/ai-financial-health", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_id: agentId,
          action,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        alert(json.error || "Action failed");
        return;
      }

      alert(json.message || "Action completed");
      await load();
    } catch (e: any) {
      alert(e?.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  const rows = useMemo(() => {
    const list = data?.dna || [];

    return list.filter((r) => {
      const search = query.toLowerCase();
      const matchesSearch =
        !search ||
        r.agent_name.toLowerCase().includes(search) ||
        r.agent_code.toLowerCase().includes(search) ||
        r.primary_route.toLowerCase().includes(search);

      const matchesRisk = risk === "all" || r.risk_level === risk;

      return matchesSearch && matchesRisk;
    });
  }, [data, query, risk]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
        Loading AI Financial Health...
      </div>
    );
  }

  if (!data?.ok) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 text-red-300">
        {data?.error || "Unable to load AI Financial Health."}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mb-6 flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
          Arfeen Intelligence
        </p>
        <h1 className="text-3xl font-bold">AI Financial Health Radar</h1>
        <p className="max-w-4xl text-sm text-slate-400">
          Agent DNA, churn prediction, projected revenue loss, fraud probability,
          route-level risk correlation, and AI Auto-Pilot actions.
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-6">
        {[
          ["Total Agents", data.summary.total_agents],
          ["Risky Agents", data.summary.risky_agents],
          ["Churn Risk", data.summary.churn_risk_agents],
          ["Growth Agents", data.summary.growth_agents],
          ["Avg Score", `${data.summary.avg_overall_score}%`],
          [
            "30-Day Loss",
            `PKR ${data.summary.projected_loss_30_days.toLocaleString()}`,
          ],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl"
          >
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {data.signals.map((s, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-white">{s.title}</h3>
              <span className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300">
                {s.severity}
              </span>
            </div>
            <p className="text-sm text-slate-400">{s.description}</p>
            <p className="mt-3 text-sm text-amber-200">{s.recommendation}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Agent Risk Correlation Map</h2>
            <p className="text-sm text-slate-400">
              Detect whether risk belongs to an agent or a business route.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {(data.route_risk_map || []).slice(0, 6).map((r) => (
            <div
              key={r.route}
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
            >
              <div className="mb-3 flex justify-between gap-3">
                <h3 className="font-semibold text-white">{r.route}</h3>
                <span className="text-sm text-amber-300">
                  {r.route_risk_score}%
                </span>
              </div>
              <Bar value={r.route_risk_score} />
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-400">
                <div>
                  <p>Bookings</p>
                  <p className="font-bold text-white">{r.total_bookings}</p>
                </div>
                <div>
                  <p>Risk Agents</p>
                  <p className="font-bold text-white">{r.risky_agents_count}</p>
                </div>
                <div>
                  <p>Revenue</p>
                  <p className="font-bold text-white">
                    {r.total_revenue.toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-amber-100">{r.alert}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search agent, code, or route..."
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-amber-400"
        />

        <select
          value={risk}
          onChange={(e) => setRisk(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-amber-400"
        >
          <option value="all">All Risk</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {rows.map((agent) => (
          <div
            key={agent.agent_id}
            className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-5 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {agent.agent_name}
                </h2>
                <p className="text-sm text-slate-400">
                  Code: {agent.agent_code} · Route: {agent.primary_route}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Bookings: {agent.total_bookings} · Sales: PKR{" "}
                  {agent.total_sales.toLocaleString()} · Status: {agent.status}
                </p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-xs ${badgeClass(
                    agent.risk_level
                  )}`}
                >
                  {agent.risk_level}
                </span>
                <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-200">
                  {trendLabel(agent.trend)}
                </span>
                {!agent.is_active && (
                  <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-200">
                    Blocked
                  </span>
                )}
              </div>
            </div>

            <div className="mb-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="mb-2 flex justify-between text-sm">
                  <span>Overall Agent DNA</span>
                  <span className="font-bold text-amber-300">
                    {agent.overall_score}%
                  </span>
                </div>
                <Bar value={agent.overall_score} />
              </div>

              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                <p className="text-sm text-red-200">Projected Revenue Impact</p>
                <p className="mt-2 text-2xl font-bold text-white">
                  PKR {agent.projected_revenue_impact.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-red-200">
                  Based on churn risk and current sales pattern.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Payment Discipline", agent.payment_discipline],
                ["Refund Behavior", agent.refund_behavior],
                ["Booking Habits", agent.booking_habits],
                ["Seasonal Performance", agent.seasonal_performance],
                ["Fraud Probability", agent.fraud_probability],
                ["Negotiation Pattern", agent.negotiation_pattern],
                ["Growth Potential", agent.growth_potential],
                ["Churn Risk", agent.churn_risk],
              ].map(([label, value]) => (
                <div
                  key={label as string}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3"
                >
                  <div className="mb-2 flex justify-between text-xs text-slate-300">
                    <span>{label}</span>
                    <span>{value}%</span>
                  </div>
                  <Bar value={Number(value)} />
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
              {agent.ai_summary}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                disabled={
                  actionLoading !== null ||
                  agent.fraud_probability < 80 ||
                  agent.is_active === false
                }
                onClick={() => runAgentAction(agent.agent_id, "ai_autopilot")}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {actionLoading === agent.agent_id + "ai_autopilot"
                  ? "Processing..."
                  : "AI Auto-Pilot Block"}
              </button>

              <button
                disabled={actionLoading !== null || agent.is_active === false}
                onClick={() => runAgentAction(agent.agent_id, "manual_review")}
                className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {actionLoading === agent.agent_id + "manual_review"
                  ? "Processing..."
                  : "Manual Approval Required"}
              </button>

              <button
                disabled={actionLoading !== null || agent.is_active === true}
                onClick={() => runAgentAction(agent.agent_id, "reactivate")}
                className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {actionLoading === agent.agent_id + "reactivate"
                  ? "Processing..."
                  : "Reactivate Agent"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}