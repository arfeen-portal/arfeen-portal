"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BrainCircuit,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  FileDown,
  Filter,
  Gauge,
  Lock,
  Minus,
  Printer,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Unlock,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ScoreReason = {
  title: string;
  detail: string;
  severity: "critical" | "high" | "medium" | "positive" | "normal" | string;
  impact: number;
};

type TrustRule = {
  rule: string;
  reason: string;
  severity: "critical" | "high" | "medium" | "normal" | "positive" | string;
};

type FuturePrediction = {
  expected_bookings: number;
  expected_profit: number;
  expected_overdue: number;
  expected_refund_risk: number;
  recommended_credit_limit: number;
  safe_commission_pct: number;
  final_decision: "Grow" | "Watch" | "Freeze" | string;
};

type RecoveryMission = {
  title: string;
  deadline_days: number;
  target: string;
  steps: string[];
};

type ActionHistoryPreview = {
  action: string;
  detail: string;
  status: string;
};

type AgentRow = {
  agent_id: string;
  agent_name: string;
  score: number;
  previous_score: number;
  score_delta: number;
  trend: number;
  total_profit: number;
  revenue: number;
  outstanding_amount: number;
  overdue_amount: number;
  credit_limit: number;
  credit_used_pct: number;
  profit_margin: number;
  refund_rate: number;
  cancellation_rate: number;
  avg_payment_delay_days: number;
  booking_count: number;
  dispute_count: number;
  risk_band: string;
  fraud_probability: number;
  loyalty_index: number;
  negotiation_power: number;
  silent_loss_forecast_30_days: number;
  commission_freeze_recommended: boolean;
  ai_action: string;
  ai_action_route: string;
  ai_action_severity: string;
  dna_summary: string;
  why_this_score: ScoreReason[];
  primary_score_reason: string;
  future_prediction: FuturePrediction;
  trust_contract: TrustRule[];
  recovery_mission: RecoveryMission;
  action_history_preview: ActionHistoryPreview[];
  final_decision: "Grow" | "Watch" | "Freeze" | string;
  recommended_credit_limit: number;
  safe_commission_pct: number;
};

type Summary = {
  total_agents: number;
  elite_agents: number;
  critical_agents: number;
  high_risk_agents: number;
  total_profit: number;
  total_outstanding: number;
  money_at_risk_30_days: number;
  freeze_recommended: number;
  decision_grow: number;
  decision_watch: number;
  decision_freeze: number;
};

type RiskDistribution = {
  name: string;
  count: number;
};

const money = (n: any) => `PKR ${Number(n || 0).toLocaleString()}`;

const scoreColor = (score: number) => {
  if (score < 35) return "bg-red-600";
  if (score < 50) return "bg-orange-500";
  if (score < 70) return "bg-amber-500";
  if (score < 85) return "bg-emerald-500";
  return "bg-indigo-600";
};

const bandStyle = (band: string) => {
  if (band === "Critical") return "bg-red-50 text-red-700 border-red-200";
  if (band === "High Risk") return "bg-orange-50 text-orange-700 border-orange-200";
  if (band === "Watchlist") return "bg-amber-50 text-amber-700 border-amber-200";
  if (band === "Elite") return "bg-indigo-50 text-indigo-700 border-indigo-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
};

const decisionStyle = (decision: string) => {
  if (decision === "Freeze") return "bg-red-600 text-white";
  if (decision === "Watch") return "bg-amber-500 text-white";
  return "bg-emerald-600 text-white";
};

const reasonBoxStyle = (severity: string) => {
  if (severity === "critical") return "border-red-200 bg-red-50";
  if (severity === "high") return "border-orange-200 bg-orange-50";
  if (severity === "medium") return "border-amber-200 bg-amber-50";
  if (severity === "positive") return "border-emerald-200 bg-emerald-50";
  return "border-slate-200 bg-slate-50";
};

const reasonTextStyle = (severity: string) => {
  if (severity === "critical") return "text-red-800";
  if (severity === "high") return "text-orange-800";
  if (severity === "medium") return "text-amber-800";
  if (severity === "positive") return "text-emerald-800";
  return "text-slate-800";
};

function MetricCard({
  title,
  value,
  icon,
  hint,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  hint: string;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">{icon}</div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Live
        </span>
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{title}</p>
      <h3 className="mt-2 text-2xl font-black text-slate-950">{value}</h3>
      <p className="mt-2 text-xs font-medium text-slate-500">{hint}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mb-8 h-44 animate-pulse rounded-[2rem] bg-slate-200" />
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-[2rem] bg-slate-200" />
        ))}
      </div>
      <div className="mt-6 h-96 animate-pulse rounded-[2rem] bg-slate-200" />
    </main>
  );
}

export default function AgentScoringPage() {
  const [rows, setRows] = useState<AgentRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [riskDistribution, setRiskDistribution] = useState<RiskDistribution[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/accounts/agent-scoring", { cache: "no-store" });
      const json = await res.json();
      setRows(json.data || []);
      setSummary(json.summary || null);
      setRiskDistribution(json.risk_distribution || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || r.agent_name.toLowerCase().includes(q);

      const matchesFilter =
        filter === "all" ||
        (filter === "critical" && ["Critical", "High Risk"].includes(r.risk_band)) ||
        (filter === "freeze" && r.final_decision === "Freeze") ||
        (filter === "watch" && r.final_decision === "Watch") ||
        (filter === "grow" && r.final_decision === "Grow") ||
        (filter === "elite" && r.risk_band === "Elite") ||
        (filter === "watchlist" && r.risk_band === "Watchlist");

      return matchesSearch && matchesFilter;
    });
  }, [rows, filter, search]);

  function exportCSV() {
    const headers = [
      "Agent",
      "Score",
      "Risk Band",
      "Decision",
      "Fraud Probability",
      "Profit",
      "Outstanding",
      "30 Day Risk",
      "Expected Bookings",
      "Expected Profit",
      "Expected Overdue",
      "Expected Refund Risk",
      "Recommended Credit Limit",
      "Safe Commission %",
      "Primary Reason",
    ];

    const lines = filteredRows.map((r) =>
      [
        r.agent_name,
        r.score,
        r.risk_band,
        r.final_decision,
        `${r.fraud_probability}%`,
        r.total_profit,
        r.outstanding_amount,
        r.silent_loss_forecast_30_days,
        r.future_prediction?.expected_bookings || 0,
        r.future_prediction?.expected_profit || 0,
        r.future_prediction?.expected_overdue || 0,
        `${r.future_prediction?.expected_refund_risk || 0}%`,
        r.future_prediction?.recommended_credit_limit || 0,
        `${r.future_prediction?.safe_commission_pct || 0}%`,
        r.primary_score_reason || "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );

    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "agent-scoring-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPrintPDF() {
    window.print();
  }

  if (loading) return <Skeleton />;

  return (
    <main className="min-h-screen bg-slate-50 p-4 print:bg-white md:p-8">
      <div className="mb-8 overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-2xl print:bg-white print:p-0 print:text-slate-950 print:shadow-none md:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-300 print:hidden">
              <BrainCircuit className="h-4 w-4 text-amber-300" />
              Agent Risk Operating System
            </div>
            <h1 className="text-3xl font-black md:text-5xl">Agent Scoring Command Center</h1>
            <p className="mt-3 max-w-3xl text-sm font-medium text-slate-400 print:text-slate-600">
              AI scoring, future behavior simulator, trust contract, contextual alerts, risk
              distribution, and management export.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 print:hidden">
            <button
              onClick={exportCSV}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white ring-1 ring-white/10 transition hover:bg-white/20"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>

            <button
              onClick={exportPrintPDF}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white ring-1 ring-white/10 transition hover:bg-white/20"
            >
              <FileDown className="h-4 w-4" />
              Print / PDF
            </button>

            <button
              onClick={loadData}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-100"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Score
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Agents"
          value={summary?.total_agents || 0}
          hint="All scored agents"
          icon={<Users className="h-5 w-5" />}
        />
        <MetricCard
          title="High Risk"
          value={summary?.high_risk_agents || 0}
          hint="Needs audit or recovery"
          icon={<ShieldAlert className="h-5 w-5" />}
        />
        <MetricCard
          title="30-Day Money At Risk"
          value={money(summary?.money_at_risk_30_days)}
          hint="Predicted silent leakage"
          icon={<Wallet className="h-5 w-5" />}
        />
        <MetricCard
          title="Freeze Recommended"
          value={summary?.freeze_recommended || 0}
          hint="Commission / credit control"
          icon={<Lock className="h-5 w-5" />}
        />
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                Risk Distribution
              </p>
              <h3 className="mt-1 text-xl font-black text-slate-950">
                Critical vs Watchlist vs Healthy
              </h3>
            </div>
            <Gauge className="h-5 w-5 text-slate-500" />
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            AI Final Decisions
          </p>

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="text-xs font-black uppercase text-emerald-600">Grow</p>
              <h4 className="mt-1 text-3xl font-black text-emerald-700">
                {summary?.decision_grow || 0}
              </h4>
            </div>

            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-xs font-black uppercase text-amber-600">Watch</p>
              <h4 className="mt-1 text-3xl font-black text-amber-700">
                {summary?.decision_watch || 0}
              </h4>
            </div>

            <div className="rounded-2xl bg-red-50 p-4">
              <p className="text-xs font-black uppercase text-red-600">Freeze</p>
              <h4 className="mt-1 text-3xl font-black text-red-700">
                {summary?.decision_freeze || 0}
              </h4>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm print:hidden lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-black text-slate-700">Risk Filters</span>
        </div>

        <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:justify-end">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agent..."
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-900 lg:w-72"
          />

          <div className="flex flex-wrap gap-2">
            {[
              ["all", "All"],
              ["critical", "Critical"],
              ["watchlist", "Watchlist"],
              ["freeze", "Freeze"],
              ["watch", "Watch"],
              ["grow", "Grow"],
              ["elite", "Elite"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-2xl px-4 py-3 text-xs font-black uppercase transition ${
                  filter === key
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1250px] text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-widest text-slate-500">
              <tr>
                <th className="p-5 text-left">Agent</th>
                <th className="p-5 text-right">Trend</th>
                <th className="p-5 text-right">Score</th>
                <th className="p-5 text-left">Why</th>
                <th className="p-5 text-right">Fraud %</th>
                <th className="p-5 text-right">Profit</th>
                <th className="p-5 text-right">30-Day Risk</th>
                <th className="p-5 text-right">Decision</th>
                <th className="p-5 text-right print:hidden">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((r) => (
                <tr
                  key={r.agent_id}
                  onClick={() => setSelectedAgent(r)}
                  className="cursor-pointer border-t transition hover:bg-slate-50"
                >
                  <td className="p-5">
                    <p className="font-black text-slate-950">{r.agent_name}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">
                      Bookings: {r.booking_count || 0} · Delay:{" "}
                      {r.avg_payment_delay_days || 0} days
                    </p>
                  </td>

                  <td className="p-5 text-right">
                    {r.trend === 1 ? (
                      <TrendingUp className="inline h-5 w-5 text-emerald-500" />
                    ) : r.trend === -1 ? (
                      <TrendingDown className="inline h-5 w-5 text-red-500" />
                    ) : (
                      <Minus className="inline h-5 w-5 text-slate-400" />
                    )}
                    <span className="ml-2 text-xs font-black text-slate-500">
                      {r.score_delta > 0 ? "+" : ""}
                      {r.score_delta}
                    </span>
                  </td>

                  <td className="p-5 text-right">
                    <div className="ml-auto w-32">
                      <div className="mb-1 flex justify-between text-xs font-black">
                        <span>{r.score}</span>
                        <span>/100</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full ${scoreColor(r.score)}`}
                          style={{ width: `${r.score}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="max-w-[320px] p-5">
                    <p className="line-clamp-2 text-xs font-bold leading-5 text-slate-500">
                      {r.primary_score_reason || "No major negative factor detected."}
                    </p>
                  </td>

                  <td className="p-5 text-right font-black text-red-600">
                    {r.fraud_probability}%
                  </td>

                  <td className="p-5 text-right font-black text-emerald-600">
                    {money(r.total_profit)}
                  </td>

                  <td className="p-5 text-right font-black text-orange-600">
                    {money(r.silent_loss_forecast_30_days)}
                  </td>

                  <td className="p-5 text-right">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase ${decisionStyle(
                        r.final_decision
                      )}`}
                    >
                      {r.final_decision}
                    </span>
                  </td>

                  <td className="p-5 text-right print:hidden">
                    <button className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">
                      View DNA <ChevronRight className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-10 text-center font-bold text-slate-400">
                    No agents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedAgent && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm print:hidden"
          onClick={() => setSelectedAgent(null)}
        >
          <div
            className="h-full w-full overflow-y-auto bg-white p-6 shadow-2xl md:w-[620px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <Sparkles className="h-3 w-3" />
                  Agent DNA Profile
                </p>
                <h2 className="text-3xl font-black text-slate-950">
                  {selectedAgent.agent_name}
                </h2>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  {selectedAgent.dna_summary}
                </p>
              </div>

              <button
                onClick={() => setSelectedAgent(null)}
                className="rounded-xl bg-slate-100 p-3 text-slate-600 hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Master Score
                  </p>
                  <Gauge className="h-5 w-5 text-amber-300" />
                </div>
                <h3 className="text-5xl font-black">{selectedAgent.score}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${bandStyle(
                      selectedAgent.risk_band
                    )}`}
                  >
                    {selectedAgent.risk_band}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${decisionStyle(
                      selectedAgent.final_decision
                    )}`}
                  >
                    Final Decision: {selectedAgent.final_decision}
                  </span>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Future Behavior Simulator
                    </p>
                    <h4 className="mt-1 text-lg font-black text-slate-950">
                      Next 30 Days Prediction
                    </h4>
                  </div>
                  <CalendarClock className="h-5 w-5 text-indigo-600" />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase text-slate-400">
                      Expected Bookings
                    </p>
                    <h4 className="mt-2 text-2xl font-black text-slate-950">
                      {selectedAgent.future_prediction?.expected_bookings || 0}
                    </h4>
                  </div>

                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <p className="text-xs font-black uppercase text-emerald-500">
                      Expected Profit
                    </p>
                    <h4 className="mt-2 text-2xl font-black text-emerald-700">
                      {money(selectedAgent.future_prediction?.expected_profit)}
                    </h4>
                  </div>

                  <div className="rounded-2xl bg-orange-50 p-4">
                    <p className="text-xs font-black uppercase text-orange-500">
                      Expected Overdue
                    </p>
                    <h4 className="mt-2 text-2xl font-black text-orange-700">
                      {money(selectedAgent.future_prediction?.expected_overdue)}
                    </h4>
                  </div>

                  <div className="rounded-2xl bg-red-50 p-4">
                    <p className="text-xs font-black uppercase text-red-500">
                      Expected Refund Risk
                    </p>
                    <h4 className="mt-2 text-2xl font-black text-red-700">
                      {selectedAgent.future_prediction?.expected_refund_risk || 0}%
                    </h4>
                  </div>

                  <div className="rounded-2xl bg-indigo-50 p-4">
                    <p className="text-xs font-black uppercase text-indigo-500">
                      Recommended Credit Limit
                    </p>
                    <h4 className="mt-2 text-2xl font-black text-indigo-700">
                      {money(selectedAgent.future_prediction?.recommended_credit_limit)}
                    </h4>
                  </div>

                  <div className="rounded-2xl bg-slate-100 p-4">
                    <p className="text-xs font-black uppercase text-slate-500">
                      Safe Commission %
                    </p>
                    <h4 className="mt-2 text-2xl font-black text-slate-950">
                      {selectedAgent.future_prediction?.safe_commission_pct || 0}%
                    </h4>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Auto Trust Contract
                    </p>
                    <h4 className="mt-1 text-lg font-black text-slate-950">
                      System-Generated Agent Restrictions
                    </h4>
                  </div>
                  <ClipboardList className="h-5 w-5 text-slate-700" />
                </div>

                <div className="space-y-3">
                  {(selectedAgent.trust_contract || []).map((item, index) => (
                    <div
                      key={`${item.rule}-${index}`}
                      className={`rounded-2xl border p-4 ${reasonBoxStyle(item.severity)}`}
                    >
                      <p className={`text-sm font-black ${reasonTextStyle(item.severity)}`}>
                        {item.rule}
                      </p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                        {item.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Recovery Mission
                    </p>
                    <h4 className="mt-1 text-lg font-black text-slate-950">
                      {selectedAgent.recovery_mission?.title}
                    </h4>
                  </div>
                  <Target className="h-5 w-5 text-red-600" />
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase text-slate-400">
                    Target within {selectedAgent.recovery_mission?.deadline_days || 7} days
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-800">
                    {selectedAgent.recovery_mission?.target}
                  </p>
                </div>

                <div className="mt-4 space-y-2">
                  {(selectedAgent.recovery_mission?.steps || []).map((step, index) => (
                    <div
                      key={`${step}-${index}`}
                      className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
                        {index + 1}
                      </span>
                      <p className="text-sm font-semibold leading-6 text-slate-700">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                      Why this score?
                    </p>
                    <h4 className="mt-1 text-lg font-black text-slate-950">
                      Automated Contextual Alerting
                    </h4>
                  </div>
                  <BrainCircuit className="h-5 w-5 text-indigo-600" />
                </div>

                <div className="mb-4 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase text-slate-400">
                    Primary reason
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-800">
                    {selectedAgent.primary_score_reason ||
                      "No major negative factor detected."}
                  </p>
                </div>

                <div className="space-y-3">
                  {(selectedAgent.why_this_score || []).map((reason, index) => (
                    <div
                      key={`${reason.title}-${index}`}
                      className={`rounded-2xl border p-4 ${reasonBoxStyle(reason.severity)}`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className={`text-sm font-black ${reasonTextStyle(reason.severity)}`}>
                          {reason.title}
                        </p>

                        {reason.impact > 0 && (
                          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase text-slate-500 shadow-sm">
                            Impact {reason.impact}
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-semibold leading-6 text-slate-700">
                        {reason.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-red-50 p-4">
                  <p className="text-xs font-black uppercase text-red-500">
                    Fraud Probability
                  </p>
                  <h4 className="mt-2 text-2xl font-black text-red-700">
                    {selectedAgent.fraud_probability}%
                  </h4>
                </div>

                <div className="rounded-2xl bg-orange-50 p-4">
                  <p className="text-xs font-black uppercase text-orange-500">
                    30-Day Silent Loss
                  </p>
                  <h4 className="mt-2 text-2xl font-black text-orange-700">
                    {money(selectedAgent.silent_loss_forecast_30_days)}
                  </h4>
                </div>

                <div className="rounded-2xl bg-indigo-50 p-4">
                  <p className="text-xs font-black uppercase text-indigo-500">
                    Loyalty Index
                  </p>
                  <h4 className="mt-2 text-2xl font-black text-indigo-700">
                    {selectedAgent.loyalty_index}/100
                  </h4>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-xs font-black uppercase text-emerald-500">
                    Negotiation Power
                  </p>
                  <h4 className="mt-2 text-2xl font-black text-emerald-700">
                    {selectedAgent.negotiation_power}/100
                  </h4>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 p-5">
                <p className="mb-4 text-xs font-black uppercase tracking-widest text-slate-500">
                  Behavioral Signals
                </p>

                <div className="space-y-3 text-sm font-bold text-slate-700">
                  <div className="flex justify-between">
                    <span>Credit Used</span>
                    <span>{selectedAgent.credit_used_pct}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Refund Rate</span>
                    <span>{selectedAgent.refund_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cancellation Rate</span>
                    <span>{selectedAgent.cancellation_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Payment Delay</span>
                    <span>{selectedAgent.avg_payment_delay_days} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Profit Margin</span>
                    <span>{selectedAgent.profit_margin}%</span>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-slate-700" />
                  <p className="text-sm font-black text-slate-950">AI Next Best Action</p>
                </div>

                <p className="text-lg font-black text-slate-950">
                  {selectedAgent.ai_action}
                </p>

                <div className="mt-5 grid gap-3">
                  <Link
                    href={selectedAgent.ai_action_route || "/accounts/agent-ledger"}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 text-sm font-black text-white hover:bg-slate-800"
                  >
                    <Eye className="h-4 w-4" />
                    Open Action Workflow
                  </Link>

                  {selectedAgent.commission_freeze_recommended ? (
                    <button className="flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-4 text-sm font-black text-white hover:bg-red-700">
                      <Lock className="h-4 w-4" />
                      Freeze Commission Recommended
                    </button>
                  ) : (
                    <button className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white hover:bg-emerald-700">
                      <Unlock className="h-4 w-4" />
                      Agent Safe for Normal Activity
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Printer className="h-5 w-5 text-slate-600" />
                  <p className="text-sm font-black text-slate-950">
                    Action History Log — Future Scope
                  </p>
                </div>

                <p className="text-sm font-semibold leading-6 text-slate-600">
                  Next step mein `agent_actions_log` table banegi jahan Freeze, Warning,
                  Monitor Weekly, Credit Reduce, aur Commission Release actions save honge.
                </p>

                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase text-slate-400">
                    Suggested Table
                  </p>
                  <code className="mt-2 block whitespace-pre-wrap text-xs font-bold leading-6 text-slate-700">
                    agent_actions_log: id, agent_id, action_type, reason, old_score,
                    new_score, created_by, created_at
                  </code>
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-amber-50 p-5 text-amber-900">
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  <p className="font-black">Unmatchable Logic Added</p>
                </div>
                <p className="text-sm font-semibold leading-6">
                  Yeh module ab sirf agent score nahi dikhata. Yeh future behavior predict karta
                  hai, next 30 days ka expected overdue/refund risk batata hai, agent ke liye trust
                  contract banata hai, aur recovery mission assign karta hai.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}