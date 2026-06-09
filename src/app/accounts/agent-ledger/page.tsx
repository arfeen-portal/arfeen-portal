"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type Entry = {
  source_id: string;
  date: string;
  type: string;
  ref_no: string;
  desc: string;
  debit: number;
  credit: number;
  status: string;
  balance: number;
  age_days: number;
  anomaly?: boolean;
  anomaly_type?: string;
  severity?: string;
  ai_reason?: string;
};

type Data = {
  entries: Entry[];
  flags: any[];
  trend: { month: string; balance: number }[];
  aging: {
    current?: number;
    days_1_30?: number;
    days_31_60?: number;
    days_61_90?: number;
    days_90_plus?: number;
  };
  summary: {
    total_debit?: number;
    total_credit?: number;
    balance?: number;
    anomaly_count?: number;
    payment_velocity?: number;
    risk_score?: number;
    risk_level?: string;
  };
};

const emptyData: Data = {
  entries: [],
  flags: [],
  trend: [],
  aging: {},
  summary: {},
};

function money(value: any) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function AgentLedgerPage() {
  const [tenantId, setTenantId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [onlyFlags, setOnlyFlags] = useState(false);
  const [selected, setSelected] = useState<Entry | null>(null);

  const [data, setData] = useState<Data>(emptyData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTenantId(localStorage.getItem("tenant_id") || "");
  }, []);

  async function loadLedger() {
    if (!tenantId || !agentId) {
      setError("Tenant ID aur Agent ID required hain.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        tenant_id: tenantId,
        agent_id: agentId,
      });

      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(`/api/accounts/agent-ledger?${params.toString()}`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || "Failed to load agent ledger.");
      }

      setData({
        entries: json.entries || json.data?.entries || [],
        flags: json.flags || json.data?.flags || [],
        trend: json.trend || json.data?.trend || [],
        aging: json.aging || json.data?.aging || {},
        summary: json.summary || json.data?.summary || {},
      });
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function resolveFlag(row: Entry) {
    if (!tenantId || !agentId || !row.ref_no) return;

    await fetch("/api/accounts/agent-ledger", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_id: tenantId,
        agent_id: agentId,
        ref_no: row.ref_no,
        anomaly_type: row.anomaly_type,
        resolved_by: localStorage.getItem("user_id") || null,
      }),
    });

    setSelected(null);
    await loadLedger();
  }

  function printLedger() {
    window.print();
  }

  const rows = useMemo(() => {
    const q = search.toLowerCase();

    return data.entries.filter((row) => {
      const matchSearch =
        !q ||
        row.ref_no?.toLowerCase().includes(q) ||
        row.desc?.toLowerCase().includes(q) ||
        row.type?.toLowerCase().includes(q) ||
        row.status?.toLowerCase().includes(q);

      const matchFlag = !onlyFlags || row.anomaly;

      return matchSearch && matchFlag;
    });
  }, [data.entries, search, onlyFlags]);

  function exportCsv() {
    const header = [
      "Date",
      "Reference",
      "Type",
      "Description",
      "Status",
      "Age Days",
      "Debit",
      "Credit",
      "Balance",
      "Severity",
      "AI Reason",
    ];

    const csvRows = rows.map((r) => [
      r.date,
      r.ref_no,
      r.type,
      r.desc,
      r.status,
      r.age_days,
      r.debit,
      r.credit,
      r.balance,
      r.severity || "",
      r.ai_reason || "",
    ]);

    const csv = [header, ...csvRows]
      .map((row) => row.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "agent-ledger-compliance-report.csv";
    a.click();

    URL.revokeObjectURL(url);
  }

  const riskClass =
    data.summary.risk_level === "Critical"
      ? "border-red-200 bg-red-50 text-red-700"
      : data.summary.risk_level === "High"
        ? "border-orange-200 bg-orange-50 text-orange-700"
        : data.summary.risk_level === "Medium"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 print:bg-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-slate-950 p-8 text-white shadow-2xl print:bg-white print:text-black print:shadow-none">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-amber-300 print:text-black">
                Audit Ready Agent Ledger
              </p>

              <h1 className="mt-3 text-3xl font-black md:text-5xl">
                Agent Financial Ledger
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-slate-300 print:text-black">
                Ledger, aging, AI anomaly flags, credit pressure, settlement velocity,
                deep drill-down, compliance resolution and dispute-ready print report.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 print:hidden">
                <p className="text-xs font-black uppercase text-slate-300">
                  6 Month Balance Trend
                </p>

                <div className="mt-2 h-20 w-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.trend || []}>
                      <Tooltip
                        formatter={(value: any) => money(value)}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="balance"
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={`rounded-2xl border px-5 py-4 ${riskClass}`}>
                <p className="text-xs font-black uppercase">Risk Level</p>
                <p className="text-3xl font-black">
                  {data.summary.risk_level || "Low"}
                </p>
                <p className="text-xs font-bold">
                  Score: {data.summary.risk_score || 0}/100
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
            <input
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="Tenant ID"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <input
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="Agent ID"
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ledger..."
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-900"
            />

            <button
              onClick={loadLedger}
              disabled={loading}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg disabled:opacity-50"
            >
              {loading ? "Loading..." : "Load Ledger"}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => setOnlyFlags((v) => !v)}
              className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-black text-amber-700"
            >
              {onlyFlags ? "Show All Entries" : "Show Flagged Only"}
            </button>

            <button
              onClick={exportCsv}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700"
            >
              Export CSV
            </button>

            <button
              onClick={printLedger}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700"
            >
              Print / Save PDF
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          {[
            ["Closing Balance", money(data.summary.balance)],
            ["Total Receivable", money(data.summary.total_debit)],
            ["Total Settled", money(data.summary.total_credit)],
            ["Payment Velocity", `${data.summary.payment_velocity || 0}%`],
            ["AI Flags", data.summary.anomaly_count || 0],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-black uppercase text-slate-400">{label}</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                Aging of Invoices
              </h2>
              <p className="text-sm font-medium text-slate-500">
                Outstanding receivables aging buckets for agent collection control.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-2 text-xs font-black uppercase text-slate-500">
              Compliance View
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
            {[
              ["Current", data.aging.current],
              ["1-30 Days", data.aging.days_1_30],
              ["31-60 Days", data.aging.days_31_60],
              ["61-90 Days", data.aging.days_61_90],
              ["90+ Days", data.aging.days_90_plus],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
              >
                <p className="text-xs font-black uppercase text-slate-400">{label}</p>
                <p className="mt-2 text-xl font-black text-slate-900">
                  {money(value)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 print:hidden">
          <h2 className="text-lg font-black text-slate-950">
            AI Decision Widget
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Critical entries trigger persistent anomaly logs. Resolved flags are stored
            with resolver ID for compliance reporting.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500">
                <tr>
                  <th className="p-5 text-left">Date</th>
                  <th className="p-5 text-left">Reference</th>
                  <th className="p-5 text-left">Type</th>
                  <th className="p-5 text-left">Description</th>
                  <th className="p-5 text-left">Age</th>
                  <th className="p-5 text-right">Debit</th>
                  <th className="p-5 text-right">Credit</th>
                  <th className="p-5 text-right">Balance</th>
                  <th className="p-5 text-left">AI</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-slate-400">
                      No ledger entries found.
                    </td>
                  </tr>
                )}

                {rows.map((row, i) => (
                  <tr
                    key={`${row.ref_no}-${i}`}
                    onClick={() => setSelected(row)}
                    className={`cursor-pointer transition ${
                      row.anomaly
                        ? "bg-red-50 hover:bg-red-100"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="p-5 font-bold">{row.date}</td>
                    <td className="p-5 font-black text-slate-950">{row.ref_no}</td>
                    <td className="p-5 font-bold uppercase text-slate-600">
                      {row.type}
                    </td>
                    <td className="p-5 text-slate-600">{row.desc}</td>
                    <td className="p-5 font-bold text-slate-500">
                      {row.age_days ? `${row.age_days} days` : "-"}
                    </td>
                    <td className="p-5 text-right font-black text-amber-600">
                      {row.debit ? money(row.debit) : "-"}
                    </td>
                    <td className="p-5 text-right font-black text-emerald-600">
                      {row.credit ? money(row.credit) : "-"}
                    </td>
                    <td className="p-5 text-right font-black text-slate-950">
                      {money(row.balance)}
                    </td>
                    <td className="p-5">
                      {row.anomaly ? (
                        <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase text-white">
                          {row.severity}
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                          Clear
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 print:hidden">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">
                    Deep Drill-down
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    {selected.ref_no}
                  </h2>
                </div>

                <button
                  onClick={() => setSelected(null)}
                  className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black"
                >
                  Close
                </button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <Info label="Date" value={selected.date} />
                <Info label="Type" value={selected.type} />
                <Info label="Status" value={selected.status} />
                <Info
                  label="Age"
                  value={selected.age_days ? `${selected.age_days} days` : "-"}
                />
                <Info label="Debit" value={money(selected.debit)} />
                <Info label="Credit" value={money(selected.credit)} />
                <Info label="Running Balance" value={money(selected.balance)} />
                <Info
                  label="Severity"
                  value={selected.anomaly ? selected.severity || "flagged" : "clear"}
                />
              </div>

              <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase text-slate-400">
                  Description
                </p>
                <p className="mt-2 font-bold text-slate-800">{selected.desc}</p>
              </div>

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs font-black uppercase text-amber-700">
                  AI Audit Reason
                </p>
                <p className="mt-2 text-sm font-bold text-amber-900">
                  {selected.ai_reason || "No abnormal pattern detected."}
                </p>
              </div>

              {selected.anomaly && (
                <button
                  onClick={() => resolveFlag(selected)}
                  className="mt-5 w-full rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white"
                >
                  Permanent Resolve Flag
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 break-words font-black text-slate-900">{value}</p>
    </div>
  );
}