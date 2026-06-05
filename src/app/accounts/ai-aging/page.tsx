"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

type Risk = "ALL" | "DANGER" | "WARNING" | "STABLE";

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

function riskClass(risk: string) {
  if (risk === "DANGER") return "border-red-200 bg-red-50 text-red-700";
  if (risk === "WARNING") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function healthBarClass(score: number) {
  if (score >= 65) return "bg-emerald-500";
  if (score >= 35) return "bg-amber-500";
  return "bg-red-500";
}

function strategy(row: Row) {
  if (row.risk_category === "DANGER") {
    return "Credit freeze + same-day escalation + written promise date required.";
  }
  if (row.risk_category === "WARNING") {
    return "Send recovery reminder, collect partial payment, and reduce credit exposure.";
  }
  return "Soft follow-up before ageing becomes risky.";
}

function AiAgingInner() {
  const params = useSearchParams();
  const router = useRouter();

  const [tenantId, setTenantId] = useState(params.get("tenant_id") || "");
  const [search, setSearch] = useState(params.get("search") || "");
  const [risk, setRisk] = useState<Risk>(
    ((params.get("risk_filter") || params.get("risk") || "ALL").toUpperCase() as Risk) || "ALL"
  );

  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const [selected, setSelected] = useState<Row | null>(null);
  const [promiseDate, setPromiseDate] = useState("");
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
      const urlParams = new URLSearchParams({
        tenant_id: tenantId.trim(),
        search: search.trim(),
        risk,
      });

      router.replace(`/accounts/ai-aging?${urlParams.toString()}`);

      const res = await fetch(`/api/accounts/reports/outstanding?${urlParams.toString()}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load AI aging data.");
      }

      setRows(json.rows || []);
      setSummary(json.summary || emptySummary);
      setSelected((json.rows || [])[0] || null);
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tenantId.trim()) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recoveryValue = useMemo(() => {
    return rows.reduce((sum, r) => sum + Number(r.bad_debt_risk || 0), 0);
  }, [rows]);

  function exportCsv() {
    const header = [
      "Agent",
      "Risk",
      "Outstanding",
      "90 Plus",
      "Health Score",
      "Bad Debt Risk",
      "Recovery Priority",
      "AI Strategy",
    ];

    const body = rows.map((r) => [
      r.agent_name,
      r.risk_category,
      r.outstanding_amount,
      r.bucket_90_plus,
      r.health_score,
      r.bad_debt_risk,
      r.recovery_priority_score,
      strategy(r),
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
    a.download = "ai-aging-recovery-command.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const selectedPhone = String(selected?.agent_phone || "").replace(/\D/g, "");
  const selectedWaText = encodeURIComponent(
    `Assalam o Alaikum ${selected?.agent_name || ""}, your outstanding balance is ${money(
      selected?.outstanding_amount || 0
    )}. Kindly confirm your payment date${promiseDate ? ` by ${promiseDate}` : ""}.`
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-600">
              AI Recovery System
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">
              AI Aging Recovery Command
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Deep-linked recovery workspace for dangerous aging, bad-debt exposure, and promise-date follow-up.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/accounts/reports/outstanding?tenant_id=${encodeURIComponent(
                tenantId
              )}&search=${encodeURIComponent(search)}&risk=${encodeURIComponent(risk)}`}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-100"
            >
              Back to Outstanding
            </Link>

            <button
              onClick={exportCsv}
              disabled={!rows.length}
              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white disabled:opacity-40"
            >
              Export Recovery CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="rounded-3xl bg-slate-950 p-6 text-white">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Recovery Queue
            </p>
            <h2 className="mt-2 text-3xl font-black">{rows.length}</h2>
          </div>

          <div className="rounded-3xl border border-red-100 bg-red-50 p-6">
            <p className="text-xs font-black uppercase tracking-widest text-red-600">
              Bad Debt Risk
            </p>
            <h2 className="mt-2 text-2xl font-black text-red-700">
              {money(recoveryValue)}
            </h2>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-6">
            <p className="text-xs font-black uppercase tracking-widest text-amber-700">
              90+ Exposure
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
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">
              Cash Pressure
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              {summary.cash_pressure_score}%
            </h2>
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
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
              onChange={(e) => setRisk(e.target.value as Risk)}
              className="rounded-2xl border px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Risk</option>
              <option value="DANGER">Danger</option>
              <option value="WARNING">Warning</option>
              <option value="STABLE">Stable</option>
            </select>

            <input
              value={promiseDate}
              onChange={(e) => setPromiseDate(e.target.value)}
              type="date"
              className="rounded-2xl border px-4 py-3 text-sm font-semibold outline-none focus:border-indigo-500"
            />

            <button
              onClick={load}
              disabled={loading}
              className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Run AI Recovery"}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 overflow-hidden rounded-3xl border bg-white shadow-sm">
            <div className="border-b bg-slate-50 px-5 py-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                Recovery Priority Queue
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-white text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-5 py-4 text-left">Party</th>
                    <th className="px-5 py-4 text-center">Health</th>
                    <th className="px-5 py-4 text-right">Outstanding</th>
                    <th className="px-5 py-4 text-right">90+</th>
                    <th className="px-5 py-4 text-center">Risk</th>
                    <th className="px-5 py-4 text-right">Select</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((r, index) => (
                    <tr
                      key={`${r.agent_name}-${index}`}
                      className={`border-t transition hover:bg-slate-50 ${
                        selected?.agent_name === r.agent_name ? "bg-indigo-50" : ""
                      }`}
                    >
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-950">{r.agent_name}</p>
                        <p className="text-xs font-semibold text-slate-400">
                          Priority: {r.recovery_priority_score}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="mx-auto w-24">
                          <div className="mb-1 flex justify-between text-[10px] font-black text-slate-500">
                            <span>{r.health_score}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full ${healthBarClass(r.health_score)}`}
                              style={{ width: `${r.health_score}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-right font-black">
                        {money(r.outstanding_amount)}
                      </td>

                      <td className="px-5 py-4 text-right font-black text-red-600">
                        {money(r.bucket_90_plus)}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`rounded-full border px-3 py-1 text-[10px] font-black ${riskClass(
                            r.risk_category
                          )}`}
                        >
                          {r.risk_category}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => setSelected(r)}
                          className="rounded-xl bg-slate-950 px-3 py-2 text-[10px] font-black text-white hover:bg-indigo-700"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!loading && rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-sm font-bold text-slate-400"
                      >
                        No AI aging recovery records found.
                      </td>
                    </tr>
                  )}

                  {loading && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-sm font-bold text-slate-400"
                      >
                        Building recovery priority queue...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-indigo-600">
              Recovery Action Brain
            </p>

            {selected ? (
              <div className="mt-4 space-y-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-950">
                    {selected.agent_name}
                  </h3>
                  <span
                    className={`mt-2 inline-flex rounded-full border px-3 py-1 text-[10px] font-black ${riskClass(
                      selected.risk_category
                    )}`}
                  >
                    {selected.risk_category}
                  </span>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase text-slate-500">
                    AI Strategy
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-700">
                    {strategy(selected)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border p-4">
                    <p className="text-xs font-black text-slate-500">Outstanding</p>
                    <p className="mt-1 text-lg font-black">
                      {money(selected.outstanding_amount)}
                    </p>
                  </div>
                  <div className="rounded-2xl border p-4">
                    <p className="text-xs font-black text-slate-500">Bad Debt</p>
                    <p className="mt-1 text-lg font-black text-red-600">
                      {money(selected.bad_debt_risk)}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border p-4">
                  <p className="text-xs font-black uppercase text-slate-500">
                    Promise Date
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-700">
                    {promiseDate || "No promise date selected."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedPhone ? (
                    <a
                      href={`https://wa.me/${selectedPhone}?text=${selectedWaText}`}
                      target="_blank"
                      className="rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white hover:bg-emerald-700"
                    >
                      Send WhatsApp
                    </a>
                  ) : (
                    <button
                      disabled
                      className="rounded-xl bg-slate-200 px-4 py-3 text-xs font-black text-slate-400"
                    >
                      No Phone
                    </button>
                  )}

                  <Link
                    href={`/accounts/ledger?search=${encodeURIComponent(
                      selected.agent_name
                    )}`}
                    className="rounded-xl bg-slate-950 px-4 py-3 text-xs font-black text-white hover:bg-indigo-700"
                  >
                    Open Ledger
                  </Link>
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                  <p className="text-xs font-black uppercase text-indigo-700">
                    Master Stroke
                  </p>
                  <p className="mt-2 text-sm font-bold text-indigo-900">
                    If this party misses the selected promise date, mark it for automatic escalation and credit review.
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm font-bold text-slate-500">
                Select a party from the queue to start recovery action.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AiAgingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 p-6">
          <div className="mx-auto max-w-7xl rounded-3xl border bg-white p-8 text-sm font-bold text-slate-500">
            Loading AI Aging Recovery Command...
          </div>
        </div>
      }
    >
      <AiAgingInner />
    </Suspense>
  );
}