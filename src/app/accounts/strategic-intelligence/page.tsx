"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Flame,
  Globe2,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";

type ApiData = {
  heatmap: any[];
  cashflow: any[];
  travelOS: any[];
  healing: any[];
  negotiation: any[];
  warRoom?: any;
  competitorRadar?: any[];
};

const emptyData: ApiData = {
  heatmap: [],
  cashflow: [],
  travelOS: [],
  healing: [],
  negotiation: [],
  warRoom: null,
  competitorRadar: [],
};

function money(n: any) {
  return Number(n || 0).toLocaleString("en-PK");
}

function pct(n: any) {
  return `${Number(n || 0).toFixed(0)}%`;
}

export default function StrategicIntelligencePage() {
  const [data, setData] = useState<ApiData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("warroom");
  const [simDemand, setSimDemand] = useState(10);
  const [simRefund, setSimRefund] = useState(5);
  const [simHotel, setSimHotel] = useState(8);
  const [simAirline, setSimAirline] = useState(6);
  const [simDelay, setSimDelay] = useState(10);
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [executingPlan, setExecutingPlan] = useState(false);
  const [actionHistory, setActionHistory] = useState<any[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/accounts/strategic-intelligence", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!json?.ok && json?.error) {
        setError(json.error);
      }

      setData(json?.data ?? emptyData);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load strategic intelligence.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const cash = data.cashflow?.[0] || {};
  const warRoom = data.warRoom || {};
  const competitorRadar = Array.isArray(data.competitorRadar)
    ? data.competitorRadar
    : [];

  const expectedInflow = Number(cash?.expected_inflow || 0);
  const expectedOutflow = Number(cash?.expected_outflow || 0);
  const projectedShortage = Number(cash?.projected_shortage || 0);

  const simulator = useMemo(() => {
    const baseRevenue = expectedInflow || 1;
    const demandLift = baseRevenue * (simDemand / 100);
    const refundHit = baseRevenue * (simRefund / 100);
    const hotelHit = expectedOutflow * (simHotel / 100);
    const airlineHit = expectedOutflow * (simAirline / 100);
    const delayHit = expectedInflow * (simDelay / 100);

    const projectedProfitImpact =
      demandLift - refundHit - hotelHit - airlineHit - delayHit;

    const simulatedCashRisk = projectedShortage + refundHit + hotelHit + airlineHit + delayHit - demandLift;

    let strategy = "Scale premium packages";
    if (simulatedCashRisk > 0) strategy = "Recover cash and freeze risky credit";
    if (simHotel > 15 || simAirline > 15) strategy = "Renegotiate suppliers before publishing packages";
    if (simRefund > 15) strategy = "Activate refund fraud and approval control";

    return {
      demandLift,
      refundHit,
      hotelHit,
      airlineHit,
      delayHit,
      projectedProfitImpact,
      simulatedCashRisk,
      strategy,
    };
  }, [
    expectedInflow,
    expectedOutflow,
    projectedShortage,
    simDemand,
    simRefund,
    simHotel,
    simAirline,
    simDelay,
  ]);

  const commandScore = Number(warRoom?.score || 0);
  const mode = String(warRoom?.mode || "NORMAL");
  const aiActions = Array.isArray(warRoom?.actions) ? warRoom.actions : [];

  const tabs = [
    ["warroom", "AI War Room"],
    ["simulator", "CEO Simulator"],
    ["radar", "Competitor Radar"],
    ["heatmap", "Umrah Heatmap"],
    ["cashflow", "Cashflow Forecast"],
    ["travelos", "Travel OS"],
    ["healing", "Self-Healing ERP"],
    ["negotiation", "Negotiation Engine"],
  ];

  async function handleAutoFix(issueId: string) {
    try {
      setFixingId(issueId);

      const res = await fetch("/api/accounts/strategic-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "FIX_ERP_ISSUE",
          issueId,
        }),
      });

      const json = await res.json();

      if (!json?.ok) {
        alert(json?.error ?? "Auto-fix failed.");
        return;
      }

      setData((prev) => ({
        ...prev,
        healing: prev.healing.map((r) =>
          String(r.id) === String(issueId) ? { ...r, status: "resolved" } : r
        ),
      }));

      setActionHistory((prev) => [
        {
          title: "Self-Healing Auto-Fix",
          status: "completed",
          detail: `ERP issue ${issueId} marked as resolved.`,
          createdAt: new Date().toLocaleString(),
        },
        ...prev,
      ]);
    } catch (err: any) {
      alert(err?.message ?? "Auto-fix failed.");
    } finally {
      setFixingId(null);
    }
  }

  async function executeAiPlan() {
    try {
      setExecutingPlan(true);

      const res = await fetch("/api/accounts/strategic-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "EXECUTE_AI_PLAN",
          plan: aiActions,
        }),
      });

      const json = await res.json();

      if (!json?.ok) {
        alert(json?.error ?? "AI plan execution failed.");
        return;
      }

      const items = Array.isArray(json.actions) ? json.actions : [];

      setActionHistory((prev) => [
        ...items.map((item: any) => ({
          title: item.title,
          status: item.status,
          detail: item.result,
          createdAt: new Date().toLocaleString(),
        })),
        ...prev,
      ]);
    } catch (err: any) {
      alert(err?.message ?? "AI plan execution failed.");
    } finally {
      setExecutingPlan(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 shadow-2xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
                Arfeen AI Strategic Intelligence
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight lg:text-5xl">
                AI Travel Command Center
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-slate-300">
                AI War Room, cashflow survival, Umrah demand intelligence,
                competitor weakness radar, self-healing ERP, supplier negotiation,
                and autonomous execution planning in one executive screen.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div
                className={`rounded-2xl border p-5 ${
                  mode === "CRITICAL"
                    ? "border-red-400/40 bg-red-500/10"
                    : mode === "WATCH"
                      ? "border-amber-300/40 bg-amber-300/10"
                      : "border-emerald-300/40 bg-emerald-300/10"
                }`}
              >
                <p className="text-sm text-slate-300">AI War Room Mode</p>
                <p className="mt-1 text-4xl font-black">{mode}</p>
                <p className="mt-1 text-xs text-slate-300">
                  Autonomous strategic status
                </p>
              </div>

              <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-5">
                <p className="text-sm text-cyan-200">Command Score</p>
                <p className="mt-1 text-4xl font-black text-cyan-200">
                  {commandScore}%
                </p>
                <p className="mt-1 text-xs text-cyan-100">
                  Overall AI operating health
                </p>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <section className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <Stat icon={<Globe2 size={18} />} title="Cities Tracked" value={data.heatmap.length} />
          <Stat icon={<Activity size={18} />} title="Live Events" value={data.travelOS.length} />
          <Stat icon={<ShieldCheck size={18} />} title="ERP Issues" value={data.healing.length} />
          <Stat icon={<AlertTriangle size={18} />} title="Supplier Alerts" value={data.negotiation.length} />
          <Stat icon={<Flame size={18} />} title="Cash Risk" value={`PKR ${money(projectedShortage)}`} />
        </section>

        <section className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/5 p-2">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                active === key
                  ? "bg-cyan-400 text-slate-950"
                  : "bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {label}
            </button>
          ))}

          <button
            onClick={load}
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/15"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </section>

        {loading ? (
          <LoadingPanel />
        ) : (
          <>
            {active === "warroom" && (
              <WarRoom
                mode={mode}
                score={commandScore}
                actions={aiActions}
                shortage={projectedShortage}
                actionHistory={actionHistory}
                onExecute={executeAiPlan}
                executing={executingPlan}
              />
            )}

            {active === "simulator" && (
              <Simulator
                simDemand={simDemand}
                setSimDemand={setSimDemand}
                simRefund={simRefund}
                setSimRefund={setSimRefund}
                simHotel={simHotel}
                setSimHotel={setSimHotel}
                simAirline={simAirline}
                setSimAirline={setSimAirline}
                simDelay={simDelay}
                setSimDelay={setSimDelay}
                result={simulator}
              />
            )}

            {active === "radar" && <CompetitorRadar rows={competitorRadar} />}

            {active === "heatmap" && <Heatmap rows={data.heatmap} />}

            {active === "cashflow" && (
              <Cashflow
                cash={cash}
                expectedInflow={expectedInflow}
                expectedOutflow={expectedOutflow}
              />
            )}

            {active === "travelos" && <TravelOS rows={data.travelOS} />}

            {active === "healing" && (
              <Healing rows={data.healing} onFix={handleAutoFix} fixingId={fixingId} />
            )}

            {active === "negotiation" && <Negotiation rows={data.negotiation} />}
          </>
        )}
      </div>
    </main>
  );
}

function WarRoom({
  mode,
  score,
  actions,
  shortage,
  actionHistory,
  onExecute,
  executing,
}: {
  mode: string;
  score: number;
  actions: any[];
  shortage: number;
  actionHistory: any[];
  onExecute: () => void;
  executing: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <section className="xl:col-span-2 rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black">AI War Room</h2>
            <p className="mt-1 text-sm text-slate-300">
              System ne current risk ke hisaab se survival aur growth actions prepare kar diye hain.
            </p>
          </div>

          <button
            onClick={onExecute}
            disabled={executing || actions.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Rocket size={17} />
            {executing ? "Executing..." : "Execute AI Plan"}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card title="War Room Mode" value={mode} danger={mode === "CRITICAL"} />
          <Card title="Command Score" value={`${score}%`} danger={score < 50} />
          <Card title="Cash Protection Target" value={`PKR ${money(shortage)}`} danger />
        </div>

        <div className="mt-6 space-y-4">
          {actions.map((a, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        a.priority === "critical"
                          ? "bg-red-500/20 text-red-300"
                          : a.priority === "high"
                            ? "bg-amber-300/20 text-amber-200"
                            : "bg-emerald-300/20 text-emerald-200"
                      }`}
                    >
                      {String(a.priority || "normal").toUpperCase()}
                    </span>
                    <h3 className="text-lg font-black">{a.title}</h3>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">{a.reason}</p>
                  <p className="mt-2 text-sm text-cyan-200">{a.action}</p>
                </div>
                <p className="rounded-xl bg-black/20 px-4 py-3 text-sm font-bold text-white">
                  {a.impact}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <h2 className="text-2xl font-black">AI Action History</h2>
        <p className="mt-1 text-sm text-slate-300">
          Current session ke executed actions.
        </p>

        <div className="mt-5 space-y-3">
          {actionHistory.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-400">
              Abhi koi action execute nahi hua.
            </div>
          ) : (
            actionHistory.map((a, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-300" />
                  <p className="font-black">{a.title}</p>
                </div>
                <p className="mt-2 text-xs text-slate-400">{a.createdAt}</p>
                <p className="mt-2 text-sm text-slate-300">{a.detail}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Simulator(props: {
  simDemand: number;
  setSimDemand: (v: number) => void;
  simRefund: number;
  setSimRefund: (v: number) => void;
  simHotel: number;
  setSimHotel: (v: number) => void;
  simAirline: number;
  setSimAirline: (v: number) => void;
  simDelay: number;
  setSimDelay: (v: number) => void;
  result: any;
}) {
  return (
    <Panel title="CEO Strategic Simulator">
      <p className="mb-6 max-w-3xl text-sm text-slate-300">
        Demand, refund, hotel cost, airline fare aur agent payment delay ko adjust kar ke AI se next strategic move dekhein.
      </p>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Slider title="Umrah Demand Increase" value={props.simDemand} onChange={props.setSimDemand} />
        <Slider title="Refund Increase Risk" value={props.simRefund} onChange={props.setSimRefund} />
        <Slider title="Hotel Cost Increase" value={props.simHotel} onChange={props.setSimHotel} />
        <Slider title="Airline Fare Increase" value={props.simAirline} onChange={props.setSimAirline} />
        <Slider title="Agent Payment Delay" value={props.simDelay} onChange={props.setSimDelay} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card title="Demand Lift" value={`PKR ${money(props.result.demandLift)}`} />
        <Card title="Cost/Risk Hit" value={`PKR ${money(props.result.refundHit + props.result.hotelHit + props.result.airlineHit + props.result.delayHit)}`} danger />
        <Card
          title="Profit Impact"
          value={`PKR ${money(props.result.projectedProfitImpact)}`}
          danger={props.result.projectedProfitImpact < 0}
        />
        <Card
          title="Cash Risk"
          value={`PKR ${money(props.result.simulatedCashRisk)}`}
          danger={props.result.simulatedCashRisk > 0}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5">
        <div className="flex items-center gap-2 text-cyan-200">
          <Sparkles size={18} />
          <h3 className="font-black">AI Best Strategy</h3>
        </div>
        <p className="mt-3 text-lg font-black text-white">{props.result.strategy}</p>
      </div>
    </Panel>
  );
}

function Slider({
  title,
  value,
  onChange,
}: {
  title: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between">
        <p className="font-bold">{title}</p>
        <p className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-black text-slate-950">
          {value}%
        </p>
      </div>
      <input
        type="range"
        min="0"
        max="50"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-4 w-full"
      />
    </div>
  );
}

function CompetitorRadar({ rows }: { rows: any[] }) {
  return (
    <Panel title="Competitor Weakness Radar">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {rows.map((r, i) => (
          <div key={i} className="rounded-2xl border border-purple-300/20 bg-purple-300/10 p-5">
            <div className="flex items-center gap-2 text-purple-200">
              <Zap size={16} />
              <h3 className="text-lg font-black">{r.title}</h3>
            </div>
            <p className="mt-3 text-sm text-slate-300">
              <span className="font-bold text-white">Signal:</span> {r.signal}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              <span className="font-bold text-white">Market Weakness:</span> {r.weakness}
            </p>
            <p className="mt-2 text-sm text-cyan-200">
              <span className="font-bold text-white">Arfeen Move:</span> {r.arfeenMove}
            </p>
            <p className="mt-4 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white">
              Advantage: {r.advantage}
            </p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function LoadingPanel() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-40 animate-pulse rounded-3xl border border-white/10 bg-white/5"
        />
      ))}
    </div>
  );
}

function Stat({ title, value, icon }: { title: string; value: any; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl">
      <div className="flex items-center justify-between text-cyan-300">
        {icon}
        <span className="text-xs font-black uppercase">Live</span>
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function Heatmap({ rows }: { rows: any[] }) {
  return (
    <Panel title="Global Live Umrah Heatmap">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {rows.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-black">{r.city}</h3>
              <span className="rounded-full bg-cyan-300 px-3 py-1 text-xs font-black text-slate-950">
                Demand {pct(r.demand_score)}
              </span>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-200">
              <p>Hotel Trend: {r.hotel_name || "N/A"} ↑ {pct(r.hotel_trend)}</p>
              <p>Airline Complaint: {r.airline || "N/A"} — {pct(r.complaint_ratio)}</p>
              <p>Route Cancellation: {r.route_name || "N/A"} — {pct(r.cancellation_ratio)}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Cashflow({
  cash,
  expectedInflow,
  expectedOutflow,
}: {
  cash: any;
  expectedInflow: number;
  expectedOutflow: number;
}) {
  const urgentAgents = Array.isArray(cash?.urgent_agent_recovery)
    ? cash.urgent_agent_recovery
    : [];
  const suppliers = Array.isArray(cash?.supplier_payment_priority)
    ? cash.supplier_payment_priority
    : [];
  const delays = Array.isArray(cash?.delay_payment_suggestions)
    ? cash.delay_payment_suggestions
    : [];

  const netPosition = expectedInflow - expectedOutflow;

  return (
    <Panel title="AI Cashflow Forecast Engine">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card title="Expected Inflow" value={`PKR ${money(expectedInflow)}`} />
        <Card title="Expected Outflow" value={`PKR ${money(expectedOutflow)}`} />
        <Card title="Net Position" value={`PKR ${money(netPosition)}`} danger={netPosition < 0} />
        <Card title="Projected Shortage" value={`PKR ${money(cash?.projected_shortage)}`} danger />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <MiniList title="Urgent Agent Recovery" rows={urgentAgents} />
        <MiniList title="Supplier Pay First" rows={suppliers} />
        <MiniList title="Delay These Payments" rows={delays} />
      </div>
    </Panel>
  );
}

function TravelOS({ rows }: { rows: any[] }) {
  return (
    <Panel title="Travel Operating System Map">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs font-bold uppercase text-cyan-300">
              {r.event_type || "EVENT"}
            </p>
            <h3 className="mt-2 text-lg font-black">{r.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{r.city || "Global"}</p>
            <p className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
              {r.status || "active"}
            </p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Healing({
  rows,
  onFix,
  fixingId,
}: {
  rows: any[];
  onFix: (id: string) => void;
  fixingId: string | null;
}) {
  return (
    <Panel title="Self-Healing ERP">
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/10 text-slate-300">
            <tr>
              <th className="p-4">Issue</th>
              <th className="p-4">Severity</th>
              <th className="p-4">Table</th>
              <th className="p-4">AI Suggestion</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const resolved = String(r.status || "").toLowerCase() === "resolved";

              return (
                <tr key={r.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="p-4 font-bold">{r.title}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1 text-xs font-black text-red-300">
                      <TrendingDown size={13} />
                      {r.severity || "medium"}
                    </span>
                  </td>
                  <td className="p-4">{r.detected_table || "N/A"}</td>
                  <td className="p-4 text-slate-300">{r.suggested_fix || "Review required"}</td>
                  <td className="p-4">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                      {r.status || "open"}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => onFix(String(r.id))}
                      disabled={resolved || fixingId === String(r.id)}
                      className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-3 py-2 text-xs font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Zap size={14} />
                      {resolved
                        ? "Resolved"
                        : fixingId === String(r.id)
                          ? "Fixing..."
                          : "Auto-Fix"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function Negotiation({ rows }: { rows: any[] }) {
  return (
    <Panel title="AI Negotiation Engine">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {rows.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-black">{r.supplier_name}</h3>
              <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-black text-slate-950">
                Overpriced {pct(r.overpricing_percentage)}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <p>Current: PKR {money(r.current_rate)}</p>
              <p>Benchmark: PKR {money(r.market_benchmark_rate)}</p>
              <p>Historical: PKR {money(r.historical_avg_rate)}</p>
              <p>Negotiate: PKR {money(r.suggested_negotiation_rate)}</p>
            </div>
            <p className="mt-4 text-sm text-slate-300">{r.notes}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
      <h2 className="mb-5 text-2xl font-black">{title}</h2>
      {children}
    </section>
  );
}

function Card({
  title,
  value,
  danger,
}: {
  title: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        danger ? "border-red-400/30 bg-red-500/10" : "border-white/10 bg-white/5"
      }`}
    >
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function MiniList({ title, rows }: { title: string; rows: any[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h3 className="font-black">{title}</h3>
      <div className="mt-4 space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-400">No urgent action detected.</p>
        ) : (
          rows.map((r, i) => (
            <div key={i} className="rounded-xl bg-black/20 p-3 text-sm">
              <p className="font-bold">
                {r.agent || r.supplier || r.payment || r.name || "Action"}
              </p>
              <p className="text-slate-300">PKR {money(r.amount)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}