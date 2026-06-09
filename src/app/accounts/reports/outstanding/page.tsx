"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Row = {
  agent_name: string;
  agent_phone?: string;
  outstanding_amount: number;
  bucket_0_30: number;
  bucket_31_60: number;
  bucket_61_90: number;
  bucket_90_plus: number;
  total_open_invoices: number;
  recovered_this_month: number;
  opening_outstanding_amount: number;
  health_score: number;
  risk_category: "DANGER" | "WARNING" | "STABLE";
  bad_debt_risk: number;
  recovery_priority_score: number;
  aging_pressure_ratio: number;
  ai_recommended_action: string;
};

type Summary = {
  total_exposure: number;
  bad_debt_risk: number;
  bucket_90_plus: number;
  open_invoices: number;
  recovered_this_month: number;
  opening_outstanding_amount: number;
  recovery_efficiency_ratio: number;
  cash_pressure_score: number;
  danger_count: number;
  warning_count: number;
  stable_count: number;
};

const emptySummary: Summary = {
  total_exposure: 0,
  bad_debt_risk: 0,
  bucket_90_plus: 0,
  open_invoices: 0,
  recovered_this_month: 0,
  opening_outstanding_amount: 0,
  recovery_efficiency_ratio: 0,
  cash_pressure_score: 0,
  danger_count: 0,
  warning_count: 0,
  stable_count: 0,
};

function money(value: number) {
  return `PKR ${Math.round(Number(value || 0)).toLocaleString()}`;
}

function badgeClass(risk: string) {
  if (risk === "DANGER") return "bg-red-100 text-red-700 border-red-200";
  if (risk === "WARNING") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-emerald-100 text-emerald-700 border-emerald-200";
}

function healthBarClass(score: number) {
  if (score >= 65) return "bg-emerald-500";
  if (score >= 35) return "bg-amber-500";
  return "bg-red-500";
}

export default function OutstandingReportPage() {
  const [tenantId, setTenantId] = useState("");
  const [search, setSearch] = useState("");
  const [risk, setRisk] = useState("ALL");
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    if (!tenantId.trim()) {
      setError("Tenant ID required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        tenant_id: tenantId.trim(),
        search: search.trim(),
        risk,
      });

      const res = await fetch(`/api/accounts/reports/outstanding?${params}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load outstanding report.");
      }

      setRows(json.rows || []);
      setSummary(json.summary || emptySummary);
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const topRecovery = useMemo(() => rows[0], [rows]);

  function exportCsv() {
    const header = [
      "Agent",
      "Outstanding",
      "0-30",
      "31-60",
      "61-90",
      "90+",
      "Open Invoices",
      "Health Score",
      "Risk",
      "Bad Debt Risk",
      "Recovery Priority",
      "AI Action",
    ];

    const body = rows.map((r) => [
      r.agent_name,
      r.outstanding_amount,
      r.bucket_0_30,
      r.bucket_31_60,
      r.bucket_61_90,
      r.bucket_90_plus,
      r.total_open_invoices,
      r.health_score,
      r.risk_category,
      r.bad_debt_risk,
      r.recovery_priority_score,
      r.ai_recommended_action,
    ]);

    const csv = [header, ...body]
      .map((line) =>
        line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "outstanding-ai-recovery-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function aiAgingHref(row: Row) {
    const params = new URLSearchParams({
      tenant_id: tenantId.trim(),
      search: row.agent_name,
      risk_filter: row.risk_category,
    });

    return `/accounts/ai-aging?${params.toString()}`;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-600">
              AI Accounts Intelligence
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">
              Outstanding Recovery Command Center
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Recovery efficiency, bad-debt exposure, ageing pressure, and AI credit actions.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/accounts/reports/aging"
              className="rounded-xl border bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-100"
            >
              Aging Report
            </Link>

            <Link
              href="/accounts/trial-balance"
              className="rounded-xl border bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-100"
            >
              Trial Balance
            </Link>

            <button
              onClick={exportCsv}
              disabled={!rows.length}
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white disabled:opacity-40"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="rounded-3xl bg-slate-950 p-6 text-white">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Total Exposure
            </p>
            <h2 className="mt-2 text-2xl font-black">
              {money(summary.total_exposure)}
            </h2>
          </div>

          <div className="rounded-3xl border border-red-100 bg-red-50 p-6">
            <p className="text-xs font-black uppercase tracking-widest text-red-600">
              Bad Debt Risk
            </p>
            <h2 className="mt-2 text-2xl font-black text-red-700">
              {money(summary.bad_debt_risk)}
            </h2>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-6">
            <p className="text-xs font-black uppercase tracking-widest text-amber-700">
              90+ Aging
            </p>
            <h2 className="mt-2 text-2xl font-black text-amber-800">
              {money(summary.bucket_90_plus)}
            </h2>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
            <p className="text-xs font-black uppercase tracking-widest text-emerald-700">
              Recovery Efficiency
            </p>
            <h2 className="mt-2 text-2xl font-black text-emerald-800">
              {summary.recovery_efficiency_ratio}%
            </h2>
            <p className="mt-1 text-xs font-bold text-emerald-700">
              {money(summary.recovered_this_month)} recovered
            </p>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">
              Cash Pressure
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              {summary.cash_pressure_score}%
            </h2>
            <p className="mt-1 text-xs font-bold text-slate-500">
              {summary.danger_count + summary.warning_count} risky parties
            </p>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">
            AI Recovery Efficiency Diagnosis
          </p>
          <p className="mt-2 text-sm font-bold text-slate-700">
            {summary.recovery_efficiency_ratio >= 75
              ? "Recovery system is performing strongly. Keep credit limits active but monitor 90+ aging."
              : summary.recovery_efficiency_ratio >= 45
              ? "Recovery is average. Focus on WARNING and DANGER accounts before month-end."
              : "Recovery efficiency is weak. Freeze high-risk credit, escalate old balances, and collect promised payment dates immediately."}
          </p>
        </div>

        {topRecovery && (
          <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-5">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-700">
              AI Highest Recovery Priority
            </p>
            <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-950">
                  {topRecovery.agent_name}
                </h3>
                <p className="text-sm font-semibold text-slate-600">
                  {topRecovery.ai_recommended_action}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-black text-slate-500">Exposure</p>
                  <p className="text-2xl font-black text-indigo-700">
                    {money(topRecovery.outstanding_amount)}
                  </p>
                </div>

                <Link
                  href={aiAgingHref(topRecovery)}
                  className="rounded-xl bg-indigo-700 px-4 py-3 text-xs font-black text-white hover:bg-slate-950"
                >
                  Open Recovery
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-3xl border bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="Tenant ID"
              className="rounded-2xl border px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agent / party"
              className="rounded-2xl border px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500"
            />

            <select
              value={risk}
              onChange={(e) => setRisk(e.target.value)}
              className="rounded-2xl border px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Risk</option>
              <option value="DANGER">Danger</option>
              <option value="WARNING">Warning</option>
              <option value="STABLE">Stable</option>
            </select>

            <button
              onClick={load}
              disabled={loading}
              className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Analyzing..." : "Analyze Outstanding"}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-5 py-4 text-left">Agent / Party</th>
                  <th className="px-5 py-4 text-center">AI Health</th>
                  <th className="px-5 py-4 text-right">Outstanding</th>
                  <th className="px-5 py-4 text-right">90+</th>
                  <th className="px-5 py-4 text-center">Open Inv.</th>
                  <th className="px-5 py-4 text-center">Risk</th>
                  <th className="px-5 py-4 text-left">AI Action</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r, index) => {
                  const phone = String(r.agent_phone || "").replace(/\D/g, "");
                  const waText = encodeURIComponent(
                    `Assalam o Alaikum ${r.agent_name}, your outstanding balance is ${money(
                      r.outstanding_amount
                    )}. Kindly confirm payment date.`
                  );

                  return (
                    <tr
                      key={`${r.agent_name}-${index}`}
                      className="border-t transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-950">
                          {r.agent_name}
                        </p>
                        <p className="text-xs font-semibold text-slate-400">
                          Priority Score: {r.recovery_priority_score}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="mx-auto w-28">
                          <div className="mb-1 flex justify-between text-[10px] font-black text-slate-500">
                            <span>{r.health_score}%</span>
                            <span>Health</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full ${healthBarClass(r.health_score)}`}
                              style={{ width: `${r.health_score}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right font-black text-slate-950">
                        {money(r.outstanding_amount)}
                      </td>

                      <td className="px-5 py-4 text-right font-black text-red-600">
                        {money(r.bucket_90_plus)}
                      </td>

                      <td className="px-5 py-4 text-center font-black">
                        {r.total_open_invoices}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] font-black ${badgeClass(
                            r.risk_category
                          )}`}
                        >
                          {r.risk_category}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="max-w-xs text-xs font-bold text-slate-600">
                          {r.ai_recommended_action}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={aiAgingHref(r)}
                            className="rounded-xl bg-slate-950 px-3 py-2 text-[10px] font-black text-white hover:bg-indigo-700"
                          >
                            Recover
                          </Link>

                          {phone ? (
                            <a
                              href={`https://wa.me/${phone}?text=${waText}`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-black text-white hover:bg-emerald-700"
                            >
                              WhatsApp
                            </a>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!loading && rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-sm font-bold text-slate-400"
                    >
                      No outstanding data found.
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-sm font-bold text-slate-400"
                    >
                      Analyzing outstanding recovery data...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}