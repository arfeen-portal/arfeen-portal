// src/app/accounts/umrah-ai-command/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Signal = {
  id: string;
  signal_type: string;
  title: string;
  city: string | null;
  severity: string;
  ai_score: number;
  current_value: number;
  recommended_action: string;
  impact_estimate: string;
  status: string;
  created_at: string;
};

type ApiResponse = {
  ok: boolean;
  summary?: {
    totalSignals: number;
    critical: number;
    high: number;
    avgAiScore: number;
  };
  signals?: Signal[];
  error?: string;
};

const labels: Record<string, string> = {
  price_war: "AI Umrah Price War Engine",
  crowd_intelligence: "Umrah Crowd Intelligence",
  refund_fraud: "AI Refund Fraud Detector",
  agent_dominance: "Agent Market Dominance Score",
  pilgrim_experience: "Live Pilgrim Experience Index",
  smart_package: "Smart Package Builder",
  cash_bleed: "Cash Bleed Map",
  negotiation: "AI Negotiation Assistant",
  travel_risk: "Travel Risk Engine",
  recovery_war_room: "Auto Recovery War Room",
};

function severityClass(severity: string) {
  if (severity === "critical") return "bg-red-100 text-red-700 border-red-200";
  if (severity === "high") return "bg-orange-100 text-orange-700 border-orange-200";
  if (severity === "medium") return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export default function UmrahAiCommandPage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [summary, setSummary] = useState<ApiResponse["summary"]>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch("/api/accounts/umrah-ai-command", {
          cache: "no-store",
        });
        const json: ApiResponse = await res.json();

        if (!json.ok) throw new Error(json.error || "Failed to load data");

        setSignals(json.signals || []);
        setSummary(json.summary);
      } catch (err: any) {
        setError(err?.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredSignals = useMemo(() => {
    if (filter === "all") return signals;
    return signals.filter((x) => x.signal_type === filter);
  }, [signals, filter]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-indigo-200">
                Arfeen Travel Intelligence
              </p>
              <h1 className="mt-3 text-3xl font-bold lg:text-5xl">
                AI Umrah Market Command Center
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
                Price war, crowd forecasting, refund fraud, agent scoring,
                pilgrim experience, smart packages, cash bleed, negotiation,
                travel risk aur recovery war room — sab aik jagah.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 text-center backdrop-blur">
              <p className="text-sm text-slate-300">Average AI Confidence</p>
              <p className="mt-2 text-5xl font-black">
                {summary?.avgAiScore ?? 0}%
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Total AI Signals</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {summary?.totalSignals ?? 0}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Critical Alerts</p>
            <p className="mt-2 text-3xl font-bold text-red-600">
              {summary?.critical ?? 0}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">High Risk Signals</p>
            <p className="mt-2 text-3xl font-bold text-orange-600">
              {summary?.high ?? 0}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Active Engines</p>
            <p className="mt-2 text-3xl font-bold text-indigo-600">10</p>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                AI Decision Board
              </h2>
              <p className="text-sm text-slate-500">
                Har signal ke sath action aur expected impact.
              </p>
            </div>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
            >
              <option value="all">All Engines</option>
              {Object.entries(labels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Engine</th>
                  <th className="px-4 py-3">Signal</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">AI Score</th>
                  <th className="px-4 py-3">Recommended Action</th>
                  <th className="px-4 py-3">Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Loading AI command center...
                    </td>
                  </tr>
                ) : filteredSignals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      No signals found.
                    </td>
                  </tr>
                ) : (
                  filteredSignals.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4 font-semibold text-slate-900">
                        {labels[item.signal_type] || item.signal_type}
                      </td>
                      <td className="px-4 py-4 text-slate-700">{item.title}</td>
                      <td className="px-4 py-4 text-slate-600">
                        {item.city || "-"}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${severityClass(
                            item.severity
                          )}`}
                        >
                          {item.severity}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-24 rounded-full bg-slate-200">
                            <div
                              className="h-2 rounded-full bg-slate-900"
                              style={{
                                width: `${Math.min(
                                  Number(item.ai_score || 0),
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="font-bold text-slate-900">
                            {item.ai_score}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {item.recommended_action}
                      </td>
                      <td className="px-4 py-4 font-semibold text-indigo-700">
                        {item.impact_estimate}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-lg font-bold text-slate-950">
              Suggested Automation Logic
            </h3>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p>• AI price war signal high ho to package margin warning show kare.</p>
              <p>• Refund fraud score 80% se upar ho to approval lock lagaye.</p>
              <p>• Agent recovery risk high ho to credit control trigger kare.</p>
              <p>• Crowd extreme ho to VIP transport buffer aur hotel alerts bheje.</p>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-lg font-bold text-slate-950">
              Business Value
            </h3>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p>• Umrah packages airline revenue management jaisi pricing pe chalenge.</p>
              <p>• Fake refunds, staff abuse aur supplier disputes early detect honge.</p>
              <p>• Agents ki future value aur collapse risk pehle se visible hogi.</p>
              <p>• Cash bleed aur recovery pressure management ko live control milega.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}