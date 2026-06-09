"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Brain,
  ShieldCheck,
  TrendingUp,
  Wallet,
  Zap,
  Activity,
  Target,
  Save,
  PlayCircle,
  RefreshCw,
} from "lucide-react";

type Scenario = {
  id: string;
  title: string;
  revenue: number;
  original_profit: number;
  simulated_profit: number;
  projected_margin: number;
  commission_rate: number;
  supplier_saving_rate: number;
  recovery_rate: number;
  recovery_gain: number;
  created_at: string;
};

type AiDecisionData = {
  tenant_id: string;
  revenue: number;
  total_cost: number;
  estimated_profit: number;
  margin: number;
  confirmed_bookings: number;
  pending_payments: number;
  expected_inflow_7d: number;
  expected_inflow_30d: number;
  risk_score: number;
  status: string;
  insight: string;
  trends: Record<string, number[]>;
  risk_contributors: any[];
  ai_actions: any[];
  scenarios: Scenario[];
};

function money(v: number) {
  return `PKR ${Number(v || 0).toLocaleString()}`;
}

export default function AiDecisionPage() {
  const router = useRouter();

  const [data, setData] = useState<AiDecisionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [commRate, setCommRate] = useState(5);
  const [supplierSaving, setSupplierSaving] = useState(2);
  const [recoveryRate, setRecoveryRate] = useState(40);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/accounts/ai-decision", { cache: "no-store" });
      const json = await res.json();
      if (json.ok) setData(json.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const simulation = useMemo(() => {
    if (!data) return null;

    const commissionGain = data.revenue * (commRate / 100);
    const supplierGain = data.total_cost * (supplierSaving / 100);
    const recoveryGain = data.pending_payments * (recoveryRate / 100);
    const simulatedProfit = data.estimated_profit + commissionGain + supplierGain;
    const projectedMargin = data.revenue ? (simulatedProfit / data.revenue) * 100 : 0;

    return {
      commissionGain,
      supplierGain,
      recoveryGain,
      simulatedProfit,
      projectedMargin,
    };
  }, [data, commRate, supplierSaving, recoveryRate]);

  async function saveScenario() {
    if (!data || !simulation) return;
    setSaving(true);

    try {
      const res = await fetch("/api/accounts/ai-decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: data.tenant_id,
          title: `Scenario ${new Date().toLocaleString()}`,
          revenue: data.revenue,
          original_profit: data.estimated_profit,
          simulated_profit: simulation.simulatedProfit,
          projected_margin: simulation.projectedMargin,
          commission_rate: commRate,
          supplier_saving_rate: supplierSaving,
          recovery_rate: recoveryRate,
          recovery_gain: simulation.recoveryGain,
        }),
      });

      const json = await res.json();
      if (json.ok) await fetchData();
      else alert(json.error || "Scenario save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !data || !simulation) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        Loading AI financial intelligence...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-50 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] border border-blue-500/20 bg-gradient-to-br from-blue-950 via-slate-950 to-slate-900 p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-xs font-black uppercase text-blue-200">
                <Brain size={16} />
                AI CFO Command Center
              </div>
              <h1 className="text-3xl font-black md:text-5xl">
                Decision Intelligence + Scenario History
              </h1>
              <p className="mt-4 max-w-4xl text-sm leading-6 text-blue-100">
                {data.insight}
              </p>
            </div>

            <button
              onClick={fetchData}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-bold"
            >
              <RefreshCw size={16} />
              Refresh AI
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <StatCard title="Revenue" value={money(data.revenue)} trend={data.trends.revenue} icon={<Wallet />} />
            <StatCard title="Profit" value={money(data.estimated_profit)} trend={data.trends.profit} icon={<TrendingUp />} />
            <StatCard title="Risk Score" value={`${data.risk_score}/100`} trend={data.trends.risk} icon={<AlertTriangle />} danger />
            <StatCard title="Status" value={data.status} trend={data.trends.cash} icon={<ShieldCheck />} />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6 lg:col-span-2">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="text-xl font-black">What-If Profit Simulator</h2>
                <p className="text-sm text-slate-400">
                  Adjust strategy and save a decision snapshot.
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-blue-400">
                  {simulation.projectedMargin.toFixed(1)}%
                </p>
                <p className="text-xs uppercase text-slate-500">Projected Margin</p>
              </div>
            </div>

            <Slider label="Commission Optimization" value={commRate} setValue={setCommRate} max={10} />
            <Slider label="Supplier Saving Target" value={supplierSaving} setValue={setSupplierSaving} max={8} />
            <Slider label="Pending Recovery Target" value={recoveryRate} setValue={setRecoveryRate} max={100} />

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <MiniResult title="Original Profit" value={money(data.estimated_profit)} />
              <MiniResult title="Simulated Profit" value={money(simulation.simulatedProfit)} />
              <MiniResult title="Cash Recovery" value={money(simulation.recoveryGain)} />
            </div>

            <button
              onClick={saveScenario}
              disabled={saving}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-5 py-3 text-sm font-black text-white hover:bg-blue-400 disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Scenario Snapshot"}
            </button>
          </div>

          <div className="rounded-[2rem] border border-red-500/20 bg-gradient-to-br from-red-950/60 to-slate-900 p-6">
            <div className="mb-4 flex items-center gap-3">
              <Activity className="text-red-400" />
              <h2 className="text-xl font-black">Trend Anomaly Detection</h2>
            </div>

            <Anomaly title="Revenue Trend" trend={data.trends.revenue} />
            <Anomaly title="Profit Trend" trend={data.trends.profit} />
            <Anomaly title="Risk Trend" trend={data.trends.risk} inverse />
            <Anomaly title="Cash Inflow Trend" trend={data.trends.cash} />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
            <div className="mb-5 flex items-center gap-3">
              <Zap className="text-blue-400" />
              <h2 className="text-xl font-black">Action-to-Workflow Bridge</h2>
            </div>

            <div className="space-y-3">
              {data.ai_actions.map((a: any) => (
                <div key={a.title} className="rounded-2xl border border-blue-400/10 bg-blue-400/5 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-black">{a.title}</p>
                      <p className="mt-1 text-xs text-blue-200">{a.impact}</p>
                      <p className="mt-2 text-sm text-slate-300">{a.action}</p>
                    </div>

                    <button
                      onClick={() => router.push(a.href)}
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-blue-500 px-3 py-2 text-xs font-black text-white hover:bg-blue-400"
                    >
                      <PlayCircle size={14} />
                      Execute
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
            <div className="mb-5 flex items-center gap-3">
              <Target className="text-amber-400" />
              <h2 className="text-xl font-black">Risk Contributors</h2>
            </div>

            <div className="space-y-3">
              {data.risk_contributors.map((r: any) => (
                <div key={r.name} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-black">{r.name}</p>
                      <p className="mt-1 text-xs text-slate-400">{r.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-red-400">{money(r.exposure)}</p>
                      <p className="text-xs uppercase text-slate-500">{r.severity}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-5 text-xl font-black">AI Scenario Snapshot History</h2>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-800 text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3">Date</th>
                  <th>Original Profit</th>
                  <th>Simulated Profit</th>
                  <th>Gain</th>
                  <th>Margin</th>
                  <th>Commission</th>
                  <th>Supplier Saving</th>
                  <th>Recovery</th>
                </tr>
              </thead>
              <tbody>
                {data.scenarios.length === 0 ? (
                  <tr>
                    <td className="py-6 text-slate-400" colSpan={8}>
                      No saved scenarios yet. Adjust sliders and click Save Scenario Snapshot.
                    </td>
                  </tr>
                ) : (
                  data.scenarios.map((s) => (
                    <tr key={s.id} className="border-b border-slate-800">
                      <td className="py-4 text-slate-300">
                        {new Date(s.created_at).toLocaleString()}
                      </td>
                      <td>{money(s.original_profit)}</td>
                      <td className="font-black text-emerald-400">{money(s.simulated_profit)}</td>
                      <td className="font-black text-blue-400">
                        {money(s.simulated_profit - s.original_profit)}
                      </td>
                      <td>{Number(s.projected_margin).toFixed(1)}%</td>
                      <td>{s.commission_rate}%</td>
                      <td>{s.supplier_saving_rate}%</td>
                      <td>{s.recovery_rate}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  trend,
  icon,
  danger = false,
}: {
  title: string;
  value: string;
  trend: number[];
  icon: any;
  danger?: boolean;
}) {
  const down = trend[trend.length - 1] < trend[0];
  const bad = danger ? !down : down;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className={bad ? "text-red-400" : "text-emerald-400"}>{icon}</div>
        <Sparkline values={trend} danger={bad} />
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{title}</p>
      <p className={bad ? "mt-2 text-xl font-black text-red-400" : "mt-2 text-xl font-black text-white"}>
        {value}
      </p>
    </div>
  );
}

function Sparkline({ values, danger }: { values: number[]; danger?: boolean }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 90;
      const y = 30 - ((v - min) / Math.max(1, max - min)) * 25;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width="92" height="34" viewBox="0 0 92 34">
      <polyline
        fill="none"
        stroke={danger ? "#f87171" : "#34d399"}
        strokeWidth="3"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Slider({
  label,
  value,
  setValue,
  max,
}: {
  label: string;
  value: number;
  setValue: (v: number) => void;
  max: number;
}) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex justify-between text-sm">
        <span className="font-bold text-slate-200">{label}</span>
        <span className="font-black text-blue-400">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        step="0.5"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-blue-500"
      />
    </div>
  );
}

function MiniResult({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <p className="text-[10px] font-black uppercase text-slate-500">{title}</p>
      <p className="mt-2 font-black text-white">{value}</p>
    </div>
  );
}

function Anomaly({
  title,
  trend,
  inverse = false,
}: {
  title: string;
  trend: number[];
  inverse?: boolean;
}) {
  const last = trend[trend.length - 1];
  const first = trend[0];
  const rising = last >= first;
  const good = inverse ? !rising : rising;

  return (
    <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-black">{title}</p>
          <p className={good ? "text-xs text-emerald-400" : "text-xs text-red-400"}>
            {good ? "Healthy movement" : "Anomaly detected"}
          </p>
        </div>
        <Sparkline values={trend} danger={!good} />
      </div>
    </div>
  );
}