"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type TrialBalanceRow = {
  account_id: string | null;
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  balance: number;
  account_type: string;
  diagnostic_flags?: string[];
  severity?: "ok" | "watch" | "critical";
};

type ApiResponse = {
  ok?: boolean;
  data?: TrialBalanceRow[];
  summary?: {
    total_debit: number;
    total_credit: number;
    difference: number;
    is_balanced: boolean;
    abnormal_count: number;
    zero_movement_count: number;
    critical_count: number;
  };
  error?: string;
};

function money(n: number) {
  return Number(n || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function severityClass(severity?: string) {
  if (severity === "critical") return "border-red-500/40 bg-red-500/10 text-red-300";
  if (severity === "watch") return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
}

export default function TrialBalancePage() {
  const router = useRouter();

  const [rows, setRows] = useState<TrialBalanceRow[]>([]);
  const [summary, setSummary] = useState<ApiResponse["summary"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");

  async function loadData() {
    setLoading(true);
    setErr("");

    try {
      const res = await fetch("/api/accounts/trial-balance", { cache: "no-store" });
      const json: ApiResponse = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || "Failed to load trial balance");
      }

      setRows(json.data || []);
      setSummary(json.summary || null);
    } catch (e: any) {
      setErr(e?.message || "Failed to load trial balance");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const hasDifference = Math.abs(summary?.difference || 0) > 0.01;

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();

    return rows.filter((r) => {
      const matchesSearch =
        !q ||
        r.account_code?.toLowerCase().includes(q) ||
        r.account_name?.toLowerCase().includes(q) ||
        r.account_type?.toLowerCase().includes(q);

      const matchesSeverity = severity === "all" || r.severity === severity;

      return matchesSearch && matchesSeverity;
    });
  }, [rows, search, severity]);

  function exportCsv() {
    const header = [
      "Account Code",
      "Account Name",
      "Type",
      "Debit",
      "Credit",
      "Balance",
      "Severity",
      "Diagnostic Flags",
    ];

    const lines = filteredRows.map((r) => [
      r.account_code,
      r.account_name,
      r.account_type,
      r.debit,
      r.credit,
      r.balance,
      r.severity || "ok",
      (r.diagnostic_flags || []).join(" | "),
    ]);

    const csv = [header, ...lines]
      .map((row) =>
        row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `trial-balance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-amber-400">
              Accounts Control
            </p>
            <h1 className="mt-2 text-3xl font-black">Trial Balance</h1>
            <p className="mt-1 text-sm text-slate-400">
              Smart diagnostic trial balance with drill-down ledger navigation.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {hasDifference ? (
              <button
                onClick={() =>
                  router.push(
                    `/accounts/journal-entry?source=trial-balance&difference=${encodeURIComponent(
                      String(summary?.difference || 0)
                    )}`
                  )
                }
                className="relative rounded-xl bg-red-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-500/20 hover:bg-red-400"
              >
                <span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-red-300" />
                Action Required
              </button>
            ) : null}

            <button
              onClick={loadData}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold hover:bg-white/10"
            >
              Refresh
            </button>

            <button
              onClick={exportCsv}
              className="rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 hover:bg-amber-300"
            >
              Export CSV
            </button>

            <button
              onClick={() => window.print()}
              className="rounded-xl bg-slate-800 px-5 py-3 text-sm font-bold hover:bg-slate-700"
            >
              Print
            </button>
          </div>
        </div>

        {err ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {err}
          </div>
        ) : null}

        {hasDifference ? (
          <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-5">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <p className="text-sm font-black text-red-200">
                  Trial Balance is not balanced.
                </p>
                <p className="mt-1 text-sm text-red-100/80">
                  Difference: <b>{money(summary?.difference || 0)}</b>. Create or review journal
                  entries to correct this mismatch.
                </p>
              </div>

              <button
                onClick={() =>
                  router.push(
                    `/accounts/journal-entry?source=trial-balance&difference=${encodeURIComponent(
                      String(summary?.difference || 0)
                    )}`
                  )
                }
                className="rounded-xl bg-white px-5 py-3 text-sm font-black text-red-600 hover:bg-red-50"
              >
                Open Journal Entry
              </button>
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-5">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase text-slate-400">Total Debit</p>
            <p className="mt-2 text-xl font-black text-emerald-300">
              {money(summary?.total_debit || 0)}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase text-slate-400">Total Credit</p>
            <p className="mt-2 text-xl font-black text-sky-300">
              {money(summary?.total_credit || 0)}
            </p>
          </div>

          <div
            className={`rounded-3xl border p-5 ${
              summary?.is_balanced
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-red-500/30 bg-red-500/10"
            }`}
          >
            <p className="text-xs uppercase text-slate-300">Difference</p>
            <p className="mt-2 text-xl font-black">{money(summary?.difference || 0)}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase text-slate-400">Abnormal Accounts</p>
            <p className="mt-2 text-xl font-black text-amber-300">
              {summary?.abnormal_count || 0}
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs uppercase text-slate-400">Critical Flags</p>
            <p className="mt-2 text-xl font-black text-red-300">
              {summary?.critical_count || 0}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <input
              value={search}
              placeholder="Search by code, account name, or type..."
              className="rounded-2xl border border-white/10 bg-slate-900 p-4 text-sm outline-none focus:border-amber-400"
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-900 p-4 text-sm outline-none focus:border-amber-400"
            >
              <option value="all">All Diagnostics</option>
              <option value="critical">Critical Only</option>
              <option value="watch">Watch Only</option>
              <option value="ok">OK Only</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-slate-900/80 uppercase text-slate-400">
                <tr>
                  <th className="p-4">Code</th>
                  <th className="p-4">Account</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 text-right">Debit</th>
                  <th className="p-4 text-right">Credit</th>
                  <th className="p-4 text-right">Net Balance</th>
                  <th className="p-4">AI Diagnostics</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Loading trial balance...
                    </td>
                  </tr>
                ) : filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, index) => (
                    <tr
                      key={`${row.account_id || row.account_code}-${index}`}
                      onClick={() => {
                        if (row.account_id) {
                          router.push(`/accounts/ledger?account_id=${row.account_id}`);
                        }
                      }}
                      className="cursor-pointer transition hover:bg-amber-400/5"
                    >
                      <td className="p-4 font-mono font-bold text-amber-300">
                        {row.account_code || "-"}
                      </td>

                      <td className="p-4 font-semibold">{row.account_name || "-"}</td>

                      <td className="p-4">
                        <span className="rounded-full border border-white/10 bg-slate-900 px-3 py-1 text-xs uppercase text-slate-300">
                          {row.account_type || "other"}
                        </span>
                      </td>

                      <td className="p-4 text-right text-emerald-200">{money(row.debit)}</td>

                      <td className="p-4 text-right text-sky-200">{money(row.credit)}</td>

                      <td className="p-4 text-right font-black">
                        {money(Math.abs(row.balance))}{" "}
                        <span className={row.balance < 0 ? "text-sky-300" : "text-emerald-300"}>
                          {row.balance < 0 ? "CR" : "DR"}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          {(row.diagnostic_flags || ["Healthy"]).map((flag) => (
                            <span
                              key={flag}
                              className={`rounded-full border px-3 py-1 text-[11px] font-bold ${severityClass(
                                row.severity
                              )}`}
                            >
                              {flag}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              <tfoot className="bg-slate-900/80 font-black">
                <tr>
                  <td className="p-4" colSpan={3}>
                    Visible Total
                  </td>
                  <td className="p-4 text-right text-emerald-300">
                    {money(filteredRows.reduce((a, r) => a + r.debit, 0))}
                  </td>
                  <td className="p-4 text-right text-sky-300">
                    {money(filteredRows.reduce((a, r) => a + r.credit, 0))}
                  </td>
                  <td className="p-4 text-right" colSpan={2}>
                    Rows: {filteredRows.length}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}