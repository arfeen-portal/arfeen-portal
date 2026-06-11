"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type AccountRow = {
  id: string | null;
  code: string;
  name: string;
  type: "assets" | "liabilities" | "equity";
  debit: number;
  credit: number;
  amount: number;
  warning?: string;
};

type BalanceSheetData = {
  asOf: string;
  snapshotSaved?: boolean;
  summary: {
    assets: number;
    liabilities: number;
    equity: number;
    rightSide: number;
    difference: number;
    balanced: boolean;
    assetToLiabilityRatio: number;
    debtRatio: number;
    netWorth: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
    aiNote: string;
    actionPlan: string[];
    negativeAccountsCount: number;
  };
  comparison?: {
    previousMonth: string;
    assetsChange: number;
    liabilitiesChange: number;
    equityChange: number;
    netWorthChange: number;
    debtRatioChange: number;
    previousRiskLevel: string;
    aiComparison: string;
  } | null;
  assets: AccountRow[];
  liabilities: AccountRow[];
  equity: AccountRow[];
};

function money(n: number) {
  return new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 2,
  }).format(Number(n || 0));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function BalanceSheetClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tenantId, setTenantId] = useState(
    searchParams.get("tenant_id") || "REAL_TENANT_ID"
  );
  const [asOf, setAsOf] = useState(searchParams.get("as_of") || today());
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function syncUrl(nextTenant = tenantId, nextAsOf = asOf) {
    const params = new URLSearchParams({
      tenant_id: nextTenant,
      as_of: nextAsOf,
    });

    router.replace(`/accounts/reports/balance-sheet?${params.toString()}`);
  }

  function goTo(path: string) {
    const params = new URLSearchParams({
      tenant_id: tenantId,
      as_of: asOf,
    });

    router.push(`${path}?${params.toString()}`);
  }

  async function fetchBalanceSheet(saveSnapshot = false) {
    setError("");

    if (!tenantId.trim()) {
      setError("tenant_id required.");
      return;
    }

    syncUrl();

    setLoading(true);

    try {
      const params = new URLSearchParams({
        tenant_id: tenantId.trim(),
        as_of: asOf,
        save_snapshot: String(saveSnapshot),
      });

      const res = await fetch(
        `/api/accounts/balance-sheet?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const json = await res.json();

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || "Failed to load balance sheet.");
      }

      setData(json.data || json);
    } catch (e: any) {
      setError(e?.message || "Failed to load balance sheet.");
    } finally {
      setLoading(false);
    }
  }

  function openLedger(row: AccountRow) {
    if (!row.id) return;

    const params = new URLSearchParams({
      account_id: row.id,
      tenant_id: tenantId,
      as_of: asOf,
      return_to: "balance-sheet",
    });

    router.push(`/accounts/ledger?${params.toString()}`);
  }

  function exportCsv() {
    if (!data) return;

    const rows = [
      ["Section", "Code", "Account", "Debit", "Credit", "Amount", "Warning"],
      ...data.assets.map((x) => [
        "Assets",
        x.code,
        x.name,
        x.debit,
        x.credit,
        x.amount,
        x.warning || "",
      ]),
      ...data.liabilities.map((x) => [
        "Liabilities",
        x.code,
        x.name,
        x.debit,
        x.credit,
        x.amount,
        x.warning || "",
      ]),
      ...data.equity.map((x) => [
        "Equity",
        x.code,
        x.name,
        x.debit,
        x.credit,
        x.amount,
        x.warning || "",
      ]),
    ];

    const csv = rows
      .map((r) =>
        r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `balance-sheet-${data.asOf}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  const equationText = useMemo(() => {
    if (!data) return "";

    return `Assets ${money(data.summary.assets)} = Liabilities ${money(
      data.summary.liabilities
    )} + Equity ${money(data.summary.equity)}`;
  }, [data]);

  const riskPercent = useMemo(() => {
    if (!data) return 0;
    if (data.summary.riskLevel === "HIGH") return 90;
    if (data.summary.riskLevel === "MEDIUM") return 55;
    return 20;
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white print:bg-white print:p-3 print:text-black">
      <div className="mx-auto max-w-7xl space-y-5 print:max-w-none print:space-y-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 print:hidden">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-black">
            <button
              onClick={() => goTo("/accounts/reports/balance-sheet")}
              className="rounded-2xl bg-indigo-500 px-4 py-2 text-white"
            >
              Balance Sheet
            </button>

            <button
              onClick={() => goTo("/accounts/reports/profit-loss")}
              className="rounded-2xl border border-white/10 px-4 py-2 text-slate-300 hover:bg-white/10"
            >
              P&L
            </button>

            <button
              onClick={() => goTo("/accounts/trial-balance")}
              className="rounded-2xl border border-white/10 px-4 py-2 text-slate-300 hover:bg-white/10"
            >
              Trial Balance
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              value={tenantId}
              onChange={(e) => {
                setTenantId(e.target.value);
                syncUrl(e.target.value, asOf);
              }}
              placeholder="tenant_id"
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-indigo-400"
            />

            <input
              type="date"
              value={asOf}
              onChange={(e) => {
                setAsOf(e.target.value);
                syncUrl(tenantId, e.target.value);
              }}
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none focus:border-indigo-400"
            />

            <button
              onClick={() => fetchBalanceSheet(false)}
              disabled={loading}
              className="rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-black hover:bg-indigo-400 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Load Report"}
            </button>

            <button
              onClick={() => fetchBalanceSheet(true)}
              disabled={loading}
              className="rounded-2xl border border-amber-400/30 px-5 py-3 text-sm font-black text-amber-300 hover:bg-amber-400/10 disabled:opacity-50"
            >
              Save Monthly AI Snapshot
            </button>

            <button
              onClick={() => window.print()}
              className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-black hover:bg-white/10"
            >
              Print / PDF
            </button>

            <button
              onClick={exportCsv}
              disabled={!data}
              className="rounded-2xl border border-emerald-400/30 px-5 py-3 text-sm font-black text-emerald-300 hover:bg-emerald-400/10 disabled:opacity-50"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl print:border-black/20 print:bg-white print:p-3 print:shadow-none">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-300 print:text-black">
            Accounts Intelligence
          </p>

          <h1 className="mt-2 text-3xl font-black print:text-xl">
            Balance Sheet Intelligence
          </h1>

          <p className="mt-2 text-sm text-slate-400 print:text-xs print:text-black">
            Unified Finance Suite: shared filters, AI solvency, monthly
            comparison, risk heat and ledger drill-down.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-bold text-red-200">
            {error}
          </div>
        )}

        {data?.snapshotSaved && (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-200 print:hidden">
            Monthly AI snapshot saved successfully.
          </div>
        )}

        {data && (
          <>
            <div className="grid gap-4 md:grid-cols-4 print:grid-cols-4 print:gap-2">
              <Stat title="Total Assets" value={money(data.summary.assets)} />
              <Stat
                title="Liabilities"
                value={money(data.summary.liabilities)}
              />
              <Stat
                title="Equity / Income"
                value={money(data.summary.equity)}
              />
              <Stat title="Net Worth" value={money(data.summary.netWorth)} />
            </div>

            <div className="rounded-3xl border border-indigo-400/20 bg-gradient-to-r from-indigo-950 to-slate-900 p-6 shadow-2xl print:border-black/20 print:bg-white print:p-3 print:shadow-none">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-300 print:text-black">
                    AI Financial Insight
                  </p>

                  <h2 className="mt-2 text-2xl font-black print:text-base">
                    Risk Level:{" "}
                    <span
                      className={
                        data.summary.riskLevel === "HIGH"
                          ? "text-red-300 print:text-black"
                          : data.summary.riskLevel === "MEDIUM"
                            ? "text-amber-300 print:text-black"
                            : "text-emerald-300 print:text-black"
                      }
                    >
                      {data.summary.riskLevel}
                    </span>
                  </h2>

                  <p className="mt-2 max-w-3xl text-sm text-slate-300 print:text-xs print:text-black">
                    {data.summary.aiNote}
                  </p>

                  <p className="mt-3 text-sm font-bold text-indigo-200 print:text-xs print:text-black">
                    {equationText}
                  </p>

                  <div className="mt-4 print:hidden">
                    <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-300">
                      <span>AI Risk Heat</span>
                      <span>{riskPercent}%</span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={
                          data.summary.riskLevel === "HIGH"
                            ? "h-full rounded-full bg-red-500"
                            : data.summary.riskLevel === "MEDIUM"
                              ? "h-full rounded-full bg-amber-400"
                              : "h-full rounded-full bg-emerald-400"
                        }
                        style={{ width: `${riskPercent}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => goTo("/accounts/reports/profit-loss")}
                    className="mt-4 rounded-2xl border border-emerald-400/30 px-4 py-2 text-xs font-black text-emerald-300 hover:bg-emerald-400/10 print:hidden"
                  >
                    View Net Profit in P&L →
                  </button>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm print:border-black/20 print:p-2 print:text-xs">
                  <p>
                    Asset/Liability Ratio:{" "}
                    <b>{data.summary.assetToLiabilityRatio}</b>
                  </p>
                  <p>
                    Debt Ratio: <b>{data.summary.debtRatio}%</b>
                  </p>
                  <p>
                    Balance Status:{" "}
                    <b
                      className={
                        data.summary.balanced
                          ? "text-emerald-300 print:text-black"
                          : "text-red-300 print:text-black"
                      }
                    >
                      {data.summary.balanced ? "Balanced" : "Not Balanced"}
                    </b>
                  </p>
                  <p>
                    Difference: <b>{money(data.summary.difference)}</b>
                  </p>
                </div>
              </div>
            </div>

            <div
              className={
                data.summary.riskLevel === "HIGH"
                  ? "rounded-3xl border border-red-400/60 bg-red-500/10 p-6 shadow-2xl shadow-red-500/20 animate-pulse print:animate-none print:border-black/20 print:bg-white print:p-3 print:shadow-none"
                  : "rounded-3xl border border-white/10 bg-white/5 p-6 print:border-black/20 print:bg-white print:p-3"
              }
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <h3 className="text-lg font-black print:text-sm">
                  AI Management Action Plan
                </h3>

                {data.summary.riskLevel === "HIGH" && (
                  <span className="rounded-full border border-red-400/40 bg-red-500/20 px-4 py-2 text-xs font-black text-red-200 print:text-black">
                    Dynamic Alert: Immediate Review Required
                  </span>
                )}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 print:grid-cols-2 print:gap-2">
                {data.summary.actionPlan.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-200 print:border-black/20 print:bg-white print:p-2 print:text-xs print:text-black"
                  >
                    <b>#{index + 1}</b> {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3 print:grid-cols-3 print:gap-2">
              <SectionCard
                title="Assets"
                rows={data.assets}
                total={data.summary.assets}
                onRowClick={openLedger}
              />
              <SectionCard
                title="Liabilities"
                rows={data.liabilities}
                total={data.summary.liabilities}
                onRowClick={openLedger}
              />
              <SectionCard
                title="Equity / Income"
                rows={data.equity}
                total={data.summary.equity}
                onRowClick={openLedger}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl print:border-black/20 print:bg-white print:p-2 print:shadow-none">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 print:text-[9px] print:text-black">
        {title}
      </p>

      <p className="mt-2 text-2xl font-black print:text-sm">{value}</p>
    </div>
  );
}

function SectionCard({
  title,
  rows,
  total,
  onRowClick,
}: {
  title: string;
  rows: AccountRow[];
  total: number;
  onRowClick: (row: AccountRow) => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl print:break-inside-avoid print:rounded-xl print:border-black/20 print:bg-white print:p-2 print:shadow-none">
      <div className="mb-4 flex items-center justify-between print:mb-2">
        <h3 className="text-xl font-black print:text-sm">{title}</h3>

        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black print:bg-white print:px-1 print:py-0 print:text-[10px]">
          {money(total)}
        </span>
      </div>

      <div className="space-y-2 print:space-y-1">
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400 print:p-2 print:text-xs print:text-black">
            No accounts found.
          </p>
        ) : (
          rows.slice(0, 18).map((row) => (
            <button
              key={`${row.type}-${row.id}-${row.code}`}
              onClick={() => onRowClick(row)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-left transition hover:border-indigo-400/50 hover:bg-indigo-500/10 print:rounded-lg print:border-black/20 print:bg-white print:p-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black print:text-[10px]">
                    {row.code} — {row.name}
                  </p>

                  <p className="mt-1 text-xs text-slate-400 print:text-[9px] print:text-black">
                    Dr {money(row.debit)} · Cr {money(row.credit)}
                  </p>

                  {row.warning && (
                    <p className="mt-2 text-xs font-bold text-red-300 print:mt-1 print:text-[9px] print:text-black">
                      ⚠ {row.warning}
                    </p>
                  )}
                </div>

                <p
                  className={
                    row.amount < 0
                      ? "font-black text-red-300 print:text-[10px] print:text-black"
                      : "font-black print:text-[10px]"
                  }
                >
                  {money(row.amount)}
                </p>
              </div>
            </button>
          ))
        )}

        {rows.length > 18 && (
          <p className="pt-2 text-xs font-bold text-slate-400 print:text-[9px] print:text-black">
            + {rows.length - 18} more accounts. See ledger drill-down for full
            detail.
          </p>
        )}
      </div>
    </div>
  );
}