"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertOctagon,
  BrainCircuit,
  CalendarClock,
  Download,
  ExternalLink,
  Flame,
  Mail,
  RefreshCw,
  Repeat,
  Search,
  ShieldAlert,
  Snowflake,
  Target,
  TrendingDown,
  UserRoundCog,
  X,
  Zap,
} from "lucide-react";

type WarningEmail = {
  subject: string;
  body: string;
};

type Playbook = {
  title?: string;
  steps?: string[];
  recovery_deadline_hours?: number;
  recommended_owner?: string;
};

type ActionLinks = {
  ledger?: string;
  booking?: string | null;
  recovery?: string;
};

type LeakRow = {
  id: string;
  created_at?: string | null;
  customer_name?: string | null;
  agent_name?: string | null;
  agent_email?: string | null;
  agent_id?: string | null;
  booking_id?: string | null;
  leak_reason?: string | null;
  severity?: string | null;
  status?: string | null;
  estimated_profit?: number | null;
  is_recurring?: boolean;
  recurring_count?: number;
  root_cause?: string;
  root_cause_label?: string;
  agent_dna_risk_score?: number;
  recovery_priority_score?: number;
  money_at_risk_30_days?: number;
  escalation_level?: "accounts" | "manager" | "director" | string;
  commission_freeze_recommended?: boolean;
  recovery_deadline_hours?: number;
  recommended_owner?: string;
  ai_playbook?: Playbook;
  warning_email?: WarningEmail;
  next_best_action?: string;
  action_links?: ActionLinks;
};

function money(v: unknown) {
  const n = Number(v || 0);
  return `PKR ${Number.isFinite(n) ? Math.abs(n).toLocaleString() : "0"}`;
}

function label(v: unknown, fallback = "Unknown") {
  return String(v || fallback).replaceAll("_", " ");
}

function pct(v: unknown) {
  const n = Number(v || 0);
  return Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0));
}

function badgeClass(severity?: string | null) {
  if (severity === "critical") return "bg-red-950 text-red-200 border-red-800";
  if (severity === "high") return "bg-amber-950 text-amber-200 border-amber-800";
  if (severity === "medium") return "bg-blue-950 text-blue-200 border-blue-800";
  return "bg-slate-800 text-slate-300 border-slate-700";
}

function escalationClass(level?: string) {
  if (level === "director") return "text-red-300 bg-red-950/60 border-red-800";
  if (level === "manager") return "text-amber-300 bg-amber-950/60 border-amber-800";
  return "text-emerald-300 bg-emerald-950/50 border-emerald-800";
}

export default function ProfitLeakDetectorPage() {
  const [rows, setRows] = useState<LeakRow[]>([]);
  const [agents, setAgents] = useState<string[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [agent, setAgent] = useState("all");
  const [rootCause, setRootCause] = useState("all");

  const [selected, setSelected] = useState<LeakRow | null>(null);
  const [emailModal, setEmailModal] = useState<LeakRow | null>(null);

  async function fetchData() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        search,
        severity,
        agent,
        root_cause: rootCause,
      });

      const res = await fetch(`/api/accounts/profit-leaks?${params.toString()}`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.error || "Profit leak data load failed.");
      }

      setRows(Array.isArray(json.data) ? json.data : []);
      setAgents(Array.isArray(json.agents) ? json.agents : []);
      setSummary(json.summary || {});
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(fetchData, 350);
    return () => clearTimeout(timer);
  }, [search, severity, agent, rootCause]);

  const computed = useMemo(() => {
    const totalRecoverable = rows.reduce((sum, r) => sum + Math.abs(Number(r.estimated_profit || 0)), 0);
    const moneyAtRisk = rows.reduce((sum, r) => sum + Math.abs(Number(r.money_at_risk_30_days || 0)), 0);
    const critical = rows.filter((r) => r.severity === "critical").length;
    const recurring = rows.filter((r) => r.is_recurring).length;
    const freeze = rows.filter((r) => r.commission_freeze_recommended).length;

    const rootMap = new Map<string, number>();
    rows.forEach((r) => {
      const key = r.root_cause_label || label(r.root_cause, "General");
      rootMap.set(key, (rootMap.get(key) || 0) + 1);
    });

    const topRootCause =
      [...rootMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "No active cluster";

    const topRisk =
      [...rows].sort(
        (a, b) => Number(b.recovery_priority_score || 0) - Number(a.recovery_priority_score || 0)
      )[0] || null;

    return {
      totalRecoverable,
      moneyAtRisk,
      critical,
      recurring,
      freeze,
      topRootCause,
      topRisk,
    };
  }, [rows]);

  const rootCauseOptions = useMemo(() => {
    const set = new Map<string, string>();
    rows.forEach((r) => {
      if (r.root_cause) set.set(r.root_cause, r.root_cause_label || label(r.root_cause));
    });
    return [...set.entries()];
  }, [rows]);

  function exportCsv() {
    const header = [
      "Customer",
      "Agent",
      "Leak Reason",
      "Root Cause",
      "Severity",
      "Recurring Count",
      "Estimated Profit",
      "Money At Risk 30 Days",
      "Agent DNA Risk",
      "Recovery Priority",
      "Escalation",
      "Deadline Hours",
      "Commission Freeze",
      "Next Best Action",
    ];

    const body = rows.map((r) => [
      r.customer_name || "",
      r.agent_name || "",
      label(r.leak_reason),
      r.root_cause_label || "",
      r.severity || "",
      String(r.recurring_count || 0),
      String(r.estimated_profit || 0),
      String(r.money_at_risk_30_days || 0),
      String(r.agent_dna_risk_score || 0),
      String(r.recovery_priority_score || 0),
      String(r.escalation_level || ""),
      String(r.recovery_deadline_hours || ""),
      r.commission_freeze_recommended ? "Yes" : "No",
      r.next_best_action || "",
    ]);

    const csv = [header, ...body]
      .map((line) => line.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-profit-leak-war-room.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyEmail(row: LeakRow) {
    const text = `${row.warning_email?.subject || ""}\n\n${row.warning_email?.body || ""}`;
    navigator.clipboard.writeText(text);
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100 md:p-8">
      <header className="mb-8 rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/50 p-8 shadow-2xl">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="rounded-2xl bg-blue-600/20 p-3 text-blue-300">
            <BrainCircuit size={26} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-300">
              AI Recovery War Room
            </p>
            <h1 className="text-4xl font-black text-white">Profit Leak Detector</h1>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="max-w-4xl text-sm leading-6 text-slate-400">
              AI playbook, Agent DNA penalty, root-cause clustering, 30-day money-at-risk forecast,
              escalation level, recovery deadline, commission-freeze recommendation, and next-best action.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <MiniPill icon={<Flame size={14} />} text={`${computed.critical} Critical`} tone="red" />
              <MiniPill icon={<Repeat size={14} />} text={`${computed.recurring} Recurring`} tone="amber" />
              <MiniPill icon={<Snowflake size={14} />} text={`${computed.freeze} Freeze Suggested`} tone="blue" />
              <MiniPill icon={<Target size={14} />} text={`Top Cluster: ${computed.topRootCause}`} tone="slate" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 rounded-2xl border border-slate-700 px-4 py-3 text-xs font-black uppercase text-slate-300 hover:bg-slate-800"
            >
              <RefreshCw size={15} />
              Refresh
            </button>

            <button
              onClick={exportCsv}
              className="flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-xs font-black uppercase text-white hover:bg-blue-500"
            >
              <Download size={15} />
              Export War Room
            </button>
          </div>
        </div>
      </header>

      <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-4">
        <StatCard
          title="Recoverable Leakage"
          value={money(summary.total_recoverable ?? computed.totalRecoverable)}
          icon={<AlertOctagon />}
          tone="emerald"
        />
        <StatCard
          title="30-Day Money at Risk"
          value={money(summary.money_at_risk_30_days ?? computed.moneyAtRisk)}
          icon={<TrendingDown />}
          tone="red"
        />
        <StatCard
          title="Recurring Patterns"
          value={String(summary.recurring_patterns ?? computed.recurring)}
          icon={<Repeat />}
          tone="amber"
        />
        <StatCard
          title="Commission Freeze"
          value={String(summary.commission_freeze_recommended ?? computed.freeze)}
          icon={<Snowflake />}
          tone="blue"
        />
      </section>

      <section className="mb-6 rounded-[2rem] border border-slate-800 bg-slate-900 p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="absolute left-4 top-3.5 text-slate-500" size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, agent, leak reason..."
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={agent}
            onChange={(e) => setAgent(e.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="all">All Agents</option>
            {agents.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <select
            value={rootCause}
            onChange={(e) => setRootCause(e.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="all">All Root Causes</option>
            {rootCauseOptions.map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        </div>
      </section>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-800 bg-red-950/50 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="border-b border-slate-800 p-5">
          <h2 className="text-lg font-black text-white">AI Leak Intelligence Table</h2>
          <p className="text-xs text-slate-500">
            Every row contains playbook, root cause, escalation, deadline and next-best action.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="bg-slate-800/50 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <tr>
                <th className="p-4">Leak / Customer</th>
                <th className="p-4">Agent DNA</th>
                <th className="p-4">Root Cause</th>
                <th className="p-4">Money Risk</th>
                <th className="p-4">Escalation</th>
                <th className="p-4">Deadline</th>
                <th className="p-4">Next Best Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-500">
                    Loading AI Profit Leak War Room...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-500">
                    No profit leaks found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-800 hover:bg-slate-800/30">
                    <td className="p-4">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => setSelected(row)}
                          className="rounded-2xl bg-blue-600/15 p-2 text-blue-300 hover:bg-blue-600/30"
                          title="Open AI Playbook"
                        >
                          <Zap size={18} />
                        </button>

                        <div>
                          <p className="font-black text-white">{row.customer_name || "Unknown Customer"}</p>
                          <p className="mt-1 text-xs capitalize text-slate-400">{label(row.leak_reason)}</p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${badgeClass(row.severity)}`}>
                              {row.severity || "low"}
                            </span>

                            {row.is_recurring && (
                              <span className="rounded-full border border-amber-800 bg-amber-950 px-2.5 py-1 text-[10px] font-black uppercase text-amber-200">
                                {row.recurring_count || 0}x Recurring
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-white">{row.agent_name || "Unknown Agent"}</p>
                      <RiskBar value={row.agent_dna_risk_score || 0} label="DNA Risk" />
                      {row.commission_freeze_recommended && (
                        <p className="mt-2 flex items-center gap-1 text-xs font-black text-blue-300">
                          <Snowflake size={13} />
                          Commission freeze recommended
                        </p>
                      )}
                    </td>

                    <td className="p-4">
                      <p className="font-bold text-slate-200">{row.root_cause_label || label(row.root_cause)}</p>
                      <p className="mt-1 text-xs text-slate-500">Cluster: {row.root_cause || "general"}</p>
                    </td>

                    <td className="p-4">
                      <p className="font-black text-emerald-400">{money(row.estimated_profit)}</p>
                      <p className="mt-1 text-xs font-bold text-red-300">
                        30-day risk: {money(row.money_at_risk_30_days)}
                      </p>
                      <RiskBar value={row.recovery_priority_score || 0} label="Priority" />
                    </td>

                    <td className="p-4">
                      <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase ${escalationClass(row.escalation_level)}`}>
                        {row.escalation_level || "accounts"}
                      </span>
                      <p className="mt-2 text-xs text-slate-500">
                        Owner: {row.recommended_owner || row.ai_playbook?.recommended_owner || "Accounts Officer"}
                      </p>
                    </td>

                    <td className="p-4">
                      <p className="flex items-center gap-2 font-black text-white">
                        <CalendarClock size={16} className="text-amber-300" />
                        {row.recovery_deadline_hours || row.ai_playbook?.recovery_deadline_hours || 72}h
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Critical leaks should close within 24h.
                      </p>
                    </td>

                    <td className="p-4">
                      <p className="mb-3 max-w-xs text-xs font-bold text-slate-300">
                        {row.next_best_action || "Review and monitor"}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSelected(row)}
                          className="rounded-xl bg-blue-600 px-3 py-2 text-[10px] font-black uppercase text-white hover:bg-blue-500"
                        >
                          Playbook
                        </button>

                        <button
                          onClick={() => setEmailModal(row)}
                          className="rounded-xl border border-slate-700 px-3 py-2 text-[10px] font-black uppercase text-slate-300 hover:bg-slate-800"
                        >
                          Warning
                        </button>

                        {row.action_links?.ledger && (
                          <a
                            href={row.action_links.ledger}
                            className="rounded-xl border border-slate-700 px-3 py-2 text-[10px] font-black uppercase text-slate-300 hover:bg-slate-800"
                          >
                            Ledger
                          </a>
                        )}

                        {row.action_links?.recovery && (
                          <a
                            href={row.action_links.recovery}
                            className="rounded-xl border border-slate-700 px-3 py-2 text-[10px] font-black uppercase text-slate-300 hover:bg-slate-800"
                          >
                            Recovery
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <Modal title="AI Recovery Playbook" onClose={() => setSelected(null)}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <InfoBox title="Agent DNA Penalty" value={`${selected.agent_dna_risk_score || 0}/100`} />
            <InfoBox title="Money at Risk 30 Days" value={money(selected.money_at_risk_30_days)} />
            <InfoBox title="Escalation Level" value={String(selected.escalation_level || "accounts").toUpperCase()} />
          </div>

          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-blue-300">
              Root Cause Cluster
            </p>
            <h3 className="text-xl font-black text-white">{selected.root_cause_label || label(selected.root_cause)}</h3>
            <p className="mt-2 text-sm text-slate-400">
              Recovery deadline:{" "}
              <span className="font-black text-amber-300">
                {selected.recovery_deadline_hours || selected.ai_playbook?.recovery_deadline_hours || 72} hours
              </span>{" "}
              • Owner:{" "}
              <span className="font-black text-white">
                {selected.recommended_owner || selected.ai_playbook?.recommended_owner || "Accounts Officer"}
              </span>
            </p>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-emerald-300">
              Exact Fix Plan
            </p>

            <ol className="space-y-3">
              {(selected.ai_playbook?.steps || []).length > 0 ? (
                selected.ai_playbook?.steps?.map((step, i) => (
                  <li key={i} className="flex gap-3 rounded-2xl bg-slate-950 p-4 text-sm text-slate-300">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))
              ) : (
                <li className="rounded-2xl bg-slate-950 p-4 text-sm text-slate-400">
                  Open booking, verify pricing/cost/commission/payment, recover amount, then mark resolved.
                </li>
              )}
            </ol>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {selected.action_links?.ledger && (
              <a className="ActionBtn" href={selected.action_links.ledger}>
                Open Ledger <ExternalLink size={14} />
              </a>
            )}

            {selected.action_links?.booking && (
              <a className="ActionBtn" href={selected.action_links.booking}>
                Open Booking <ExternalLink size={14} />
              </a>
            )}

            {selected.action_links?.recovery && (
              <a className="ActionBtn" href={selected.action_links.recovery}>
                Recovery Path <ExternalLink size={14} />
              </a>
            )}

            <button className="ActionBtnSecondary" onClick={() => setEmailModal(selected)}>
              Generate Warning <Mail size={14} />
            </button>
          </div>
        </Modal>
      )}

      {emailModal && (
        <Modal title="Agent Warning Email Generator" onClose={() => setEmailModal(null)}>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Subject</p>
            <p className="mt-2 font-black text-white">{emailModal.warning_email?.subject || "Action Required"}</p>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Body</p>
            <pre className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
              {emailModal.warning_email?.body || "Warning email not available from route."}
            </pre>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button className="ActionBtn" onClick={() => copyEmail(emailModal)}>
              Copy Email <Mail size={14} />
            </button>

            {emailModal.action_links?.ledger && (
              <a className="ActionBtnSecondary" href={emailModal.action_links.ledger}>
                Open Ledger <ExternalLink size={14} />
              </a>
            )}
          </div>
        </Modal>
      )}

      <style jsx>{`
        .ActionBtn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 16px;
          background: #2563eb;
          color: white;
          padding: 12px 16px;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .ActionBtn:hover {
          background: #3b82f6;
        }

        .ActionBtnSecondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 16px;
          border: 1px solid #334155;
          color: #cbd5e1;
          padding: 12px 16px;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .ActionBtnSecondary:hover {
          background: #1e293b;
        }
      `}</style>
    </main>
  );
}

function RiskBar({ value, label }: { value: number; label: string }) {
  const safe = pct(value);

  return (
    <div className="mt-2">
      <div className="mb-1 flex justify-between text-[10px] font-bold uppercase text-slate-500">
        <span>{label}</span>
        <span>{safe}/100</span>
      </div>
      <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full ${
            safe >= 85 ? "bg-red-500" : safe >= 65 ? "bg-amber-500" : safe >= 40 ? "bg-blue-500" : "bg-emerald-500"
          }`}
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  tone: "emerald" | "red" | "amber" | "blue";
}) {
  const toneClass =
    tone === "red"
      ? "text-red-300 bg-red-950/40"
      : tone === "amber"
      ? "text-amber-300 bg-amber-950/40"
      : tone === "blue"
      ? "text-blue-300 bg-blue-950/40"
      : "text-emerald-300 bg-emerald-950/40";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
      <div className={`mb-4 inline-flex rounded-2xl p-3 ${toneClass}`}>{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function MiniPill({
  icon,
  text,
  tone,
}: {
  icon: React.ReactNode;
  text: string;
  tone: "red" | "amber" | "blue" | "slate";
}) {
  const cls =
    tone === "red"
      ? "border-red-800 bg-red-950/50 text-red-200"
      : tone === "amber"
      ? "border-amber-800 bg-amber-950/50 text-amber-200"
      : tone === "blue"
      ? "border-blue-800 bg-blue-950/50 text-blue-200"
      : "border-slate-700 bg-slate-800 text-slate-300";

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${cls}`}>
      {icon}
      {text}
    </span>
  );
}

function InfoBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-slate-700 bg-slate-950 p-6 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-300">
              AI Profit Leak War Room
            </p>
            <h2 className="mt-1 text-2xl font-black text-white">{title}</h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-700 p-3 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}