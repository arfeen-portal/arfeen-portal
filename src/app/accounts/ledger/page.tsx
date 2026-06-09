"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

type AccountRow = {
  id: string;
  [key: string]: any;
};

type LedgerLine = {
  id?: string;
  account_id?: string | null;
  account_code?: string | null;
  account_name?: string | null;
  code?: string | null;
  name?: string | null;
  created_at?: string | null;
  entry_date?: string | null;
  voucher_date?: string | null;
  date?: string | null;
  transaction_date?: string | null;
  posting_date?: string | null;
  voucher_id?: string | null;
  voucher_no?: string | null;
  voucher_number?: string | null;
  voucher_type?: string | null;
  description?: string | null;
  narration?: string | null;
  debit?: number | string | null;
  credit?: number | string | null;
  amount?: number | string | null;
  runningBalance?: number;
  anomalyScore?: number;
  anomalyReasons?: string[];
  isFlagged?: boolean;
  aiDecision?: string;
  [key: string]: any;
};

const STORAGE_KEY = "arfeen-ledger-filters";
const ANOMALY_AMOUNT_THRESHOLD = 50000;
const HIGH_RISK_AMOUNT_THRESHOLD = 150000;
const IMBALANCE_RATIO_THRESHOLD = 3;

function money(value: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function getAccountLabel(a?: any | null) {
  if (!a) return "";

  const code =
    a.code ||
    a.account_code ||
    a.account_no ||
    a.account_number ||
    "No Code";

  const name =
    a.name ||
    a.account_name ||
    a.title ||
    a.account_title ||
    "Unnamed Account";

  return `${code} - ${name}`;
}

function getLineDate(row: LedgerLine) {
  return (
    row.entry_date ||
    row.voucher_date ||
    row.date ||
    row.transaction_date ||
    row.posting_date ||
    row.created_at ||
    ""
  );
}

function getLineAccountCode(row: LedgerLine) {
  return row.account_code || row.code || row.account_no || row.account_number || "-";
}

function getLineAccountName(row: LedgerLine) {
  return row.account_name || row.name || row.account_title || row.title || "";
}

function getVoucherNo(row: LedgerLine) {
  return row.voucher_no || row.voucher_number || row.voucher_id || "-";
}

function getDescription(row: LedgerLine) {
  return row.description || row.narration || "-";
}

function getMovement(row: LedgerLine) {
  return Math.max(Number(row.debit) || 0, Number(row.credit) || 0);
}

function getRiskLevel(score: number) {
  if (score >= 75) return "High";
  if (score >= 35) return "Medium";
  return "Low";
}

function detectLineAnomaly(row: LedgerLine, avgMovement: number) {
  const debit = Number(row.debit) || 0;
  const credit = Number(row.credit) || 0;
  const movement = Math.max(debit, credit);
  const description = getDescription(row).toLowerCase();

  const reasons: string[] = [];
  let score = 0;

  if (movement >= HIGH_RISK_AMOUNT_THRESHOLD) {
    score += 60;
    reasons.push(`High-value movement above ${money(HIGH_RISK_AMOUNT_THRESHOLD)}.`);
  } else if (movement >= ANOMALY_AMOUNT_THRESHOLD) {
    score += 35;
    reasons.push(`Movement above ${money(ANOMALY_AMOUNT_THRESHOLD)}.`);
  }

  if (avgMovement > 0 && movement >= avgMovement * 3 && movement >= ANOMALY_AMOUNT_THRESHOLD) {
    score += 30;
    reasons.push("This entry is more than 3x higher than average movement.");
  }

  if (credit >= ANOMALY_AMOUNT_THRESHOLD && debit === 0) {
    score += 15;
    reasons.push("Large cash/credit outflow detected.");
  }

  if (
    description.includes("refund") ||
    description.includes("reversal") ||
    description.includes("adjustment") ||
    description.includes("void") ||
    description.includes("cancel")
  ) {
    score += 20;
    reasons.push("Sensitive narration keyword found: refund/reversal/adjustment/void/cancel.");
  }

  if (!description || description === "-") {
    score += 10;
    reasons.push("Missing narration/description.");
  }

  return {
    score: Math.min(score, 100),
    reasons,
    flagged: score >= 35,
  };
}

export default function LedgerPage() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [rows, setRows] = useState<LedgerLine[]>([]);

  const [accountId, setAccountId] = useState("");
  const [accountSearch, setAccountSearch] = useState("");
  const [showAccountList, setShowAccountList] = useState(false);

  const [dateFrom, setDateFrom] = useState(startOfMonth());
  const [dateTo, setDateTo] = useState(today());
  const [search, setSearch] = useState("");

  const [selectedLine, setSelectedLine] = useState<LedgerLine | null>(null);

  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [savingFlags, setSavingFlags] = useState(false);
  const [savedFlags, setSavedFlags] = useState(0);
  const [error, setError] = useState("");

  const selectedAccount = accounts.find((a) => a.id === accountId);

  const filteredAccounts = useMemo(() => {
    const q = accountSearch.toLowerCase().trim();

    if (!q) return accounts.slice(0, 80);

    return accounts
      .filter((a) => getAccountLabel(a).toLowerCase().includes(q))
      .slice(0, 80);
  }, [accounts, accountSearch]);

  const computed = useMemo(() => {
    let running = 0;

    const rawLines = rows.map((row) => {
      const debit = Number(row.debit) || 0;
      const credit = Number(row.credit) || 0;

      running += debit - credit;

      return {
        ...row,
        debit,
        credit,
        runningBalance: running,
      };
    });

    const movements = rawLines.map((r) => getMovement(r)).filter((v) => v > 0);
    const avgMovement =
      movements.length > 0
        ? movements.reduce((sum, v) => sum + v, 0) / movements.length
        : 0;

    let aiDecision = "Normal ledger activity detected.";
    let aiRiskLevel: "Low" | "Medium" | "High" = "Low";

    const totalDebitRaw = rawLines.reduce((s, r) => s + (Number(r.debit) || 0), 0);
    const totalCreditRaw = rawLines.reduce((s, r) => s + (Number(r.credit) || 0), 0);

    const debitCreditRatio =
      totalCreditRaw > 0 ? totalDebitRaw / totalCreditRaw : totalDebitRaw > 0 ? 999 : 1;

    const imbalanceWarning =
      debitCreditRatio >= IMBALANCE_RATIO_THRESHOLD ||
      debitCreditRatio <= 1 / IMBALANCE_RATIO_THRESHOLD;

    const lines = rawLines.map((row) => {
      const anomaly = detectLineAnomaly(row, avgMovement);
      return {
        ...row,
        anomalyScore: anomaly.score,
        anomalyReasons: anomaly.reasons,
        isFlagged: anomaly.flagged,
      };
    });

    const flaggedLines = lines.filter((r) => r.isFlagged);
    const highestRisk = Math.max(0, ...lines.map((r) => Number(r.anomalyScore) || 0));

    if (flaggedLines.length >= 3 || highestRisk >= 75 || imbalanceWarning) {
      aiDecision =
        "High attention required. Multiple unusual ledger movements or imbalance pattern detected.";
      aiRiskLevel = "High";
    } else if (flaggedLines.length > 0 || highestRisk >= 35) {
      aiDecision =
        "Review recommended. Some transactions are above normal movement pattern.";
      aiRiskLevel = "Medium";
    }

    const finalLines = lines.map((line) => ({
      ...line,
      aiDecision,
    }));

    const totalDebit = finalLines.reduce((s, r) => s + (Number(r.debit) || 0), 0);
    const totalCredit = finalLines.reduce((s, r) => s + (Number(r.credit) || 0), 0);
    const highestDebit = Math.max(0, ...finalLines.map((r) => Number(r.debit) || 0));
    const highestCredit = Math.max(0, ...finalLines.map((r) => Number(r.credit) || 0));

    return {
      lines: finalLines,
      totalDebit,
      totalCredit,
      closingBalance: running,
      entryCount: finalLines.length,
      highestDebit,
      highestCredit,
      debitCount: finalLines.filter((r) => Number(r.debit) > 0).length,
      creditCount: finalLines.filter((r) => Number(r.credit) > 0).length,
      flaggedLines: finalLines.filter((r) => r.isFlagged),
      highestRisk,
      avgMovement,
      aiDecision,
      aiRiskLevel,
      imbalanceWarning,
      status:
        running > 0 ? "Debit Balance" : running < 0 ? "Credit Balance" : "Balanced",
    };
  }, [rows]);

  async function loadAccounts() {
    setLoadingAccounts(true);
    setError("");

    try {
      const supabase = getSupabaseClient();

      if (!supabase) {
        setError("Supabase browser client not configured.");
        return;
      }

      const { data, error } = await supabase.from("acc_accounts").select("*");

      if (error) throw error;

      const sorted = (data ?? []).sort((a: any, b: any) => {
        const ac = String(a.code || a.account_code || a.name || a.account_name || "");
        const bc = String(b.code || b.account_code || b.name || b.account_name || "");
        return ac.localeCompare(bc);
      });

      setAccounts(sorted);
    } catch (err: any) {
      setError(err?.message || "Failed to load accounts.");
    } finally {
      setLoadingAccounts(false);
    }
  }

  async function loadLedger() {
    setLoadingLedger(true);
    setSavedFlags(0);
    setError("");

    try {
      const params = new URLSearchParams();

      if (accountId) params.set("accountId", accountId);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (search) params.set("search", search);

      const res = await fetch(`/api/accounts/ledger?${params.toString()}`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load ledger.");
      }

      setRows(json.data ?? []);
    } catch (err: any) {
      setError(err?.message || "Failed to load ledger.");
    } finally {
      setLoadingLedger(false);
    }
  }

  async function saveAnomalyLogs() {
    if (computed.flaggedLines.length === 0) {
      setError("No flagged transactions available to save.");
      return;
    }

    setSavingFlags(true);
    setError("");

    try {
      const res = await fetch("/api/accounts/ledger/anomaly-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: computed.flaggedLines.map((line) => ({
            ...line,
            transaction_date: getLineDate(line).slice(0, 10) || null,
            aiDecision: computed.aiDecision,
          })),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save anomaly logs.");
      }

      setSavedFlags(json.saved || computed.flaggedLines.length);
    } catch (err: any) {
      setError(err?.message || "Failed to save anomaly logs.");
    } finally {
      setSavingFlags(false);
    }
  }

  function resetFilters() {
    setAccountId("");
    setAccountSearch("");
    setDateFrom(startOfMonth());
    setDateTo(today());
    setSearch("");
    setRows([]);
    setSelectedLine(null);
    setSavedFlags(0);
    localStorage.removeItem(STORAGE_KEY);
    setError("");
  }

  function selectAccount(a: AccountRow) {
    setAccountId(a.id);
    setAccountSearch(getAccountLabel(a));
    setShowAccountList(false);
  }

  function clearAccount() {
    setAccountId("");
    setAccountSearch("");
    setShowAccountList(false);
  }

  function printLedger() {
    window.print();
  }

  function exportCSV() {
    const header = [
      "Date",
      "Account",
      "Voucher",
      "Type",
      "Description",
      "Debit",
      "Credit",
      "Balance",
      "AI Flagged",
      "AI Risk Score",
      "AI Risk Level",
      "AI Reasons",
    ];

    const body = computed.lines.map((r) => [
      getLineDate(r).slice(0, 10),
      `${getLineAccountCode(r)} ${getLineAccountName(r)}`,
      getVoucherNo(r),
      r.voucher_type || "Entry",
      getDescription(r),
      Number(r.debit) || 0,
      Number(r.credit) || 0,
      Number(r.runningBalance) || 0,
      r.isFlagged ? "Yes" : "No",
      Number(r.anomalyScore) || 0,
      getRiskLevel(Number(r.anomalyScore) || 0),
      (r.anomalyReasons || []).join(" | "),
    ]);

    const csv = [header, ...body]
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `ledger-${dateFrom || "from"}-${dateTo || "to"}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        if (parsed.accountId) setAccountId(parsed.accountId);
        if (parsed.accountSearch) setAccountSearch(parsed.accountSearch);
        if (parsed.dateFrom) setDateFrom(parsed.dateFrom);
        if (parsed.dateTo) setDateTo(parsed.dateTo);
        if (parsed.search) setSearch(parsed.search);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    loadAccounts();
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        accountId,
        accountSearch,
        dateFrom,
        dateTo,
        search,
      })
    );
  }, [accountId, accountSearch, dateFrom, dateTo, search]);

  useEffect(() => {
    loadLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accountLabel = selectedAccount ? getAccountLabel(selectedAccount) : "All Accounts";

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-950 print:bg-white print:p-0">
      <style>{`
        .ledger-scroll {
          scrollbar-width: thin;
          scrollbar-color: #c7d2fe transparent;
        }

        .ledger-scroll::-webkit-scrollbar {
          height: 8px;
        }

        .ledger-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .ledger-scroll::-webkit-scrollbar-thumb {
          background: #c7d2fe;
          border-radius: 999px;
        }

        @media print {
          .no-print { display: none !important; }
          .print-card {
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 0 !important;
          }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
        }
      `}</style>

      <div className="mx-auto max-w-7xl space-y-6">
        <div className="print-card rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-600">
                Arfeen Travel Accounts
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">
                General Ledger
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Audit-ready ledger with permanent AI anomaly logging, drill-down, print and export.
              </p>
            </div>

            <div className="no-print flex flex-wrap gap-3">
              <button
                onClick={printLedger}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                Print
              </button>

              <button
                onClick={exportCSV}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                Export CSV
              </button>

              <button
                onClick={loadLedger}
                className="rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="no-print grid gap-4 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm md:grid-cols-5">
          <div className="relative space-y-1 md:col-span-2">
            <label className="text-xs font-black uppercase text-slate-400">
              Search Account
            </label>

            <div className="flex gap-2">
              <input
                value={accountSearch}
                onFocus={() => setShowAccountList(true)}
                onChange={(e) => {
                  setAccountSearch(e.target.value);
                  setShowAccountList(true);
                  if (!e.target.value) setAccountId("");
                }}
                placeholder={
                  loadingAccounts ? "Loading accounts..." : "Search code or account name..."
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
              />

              {accountId ? (
                <button
                  onClick={clearAccount}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-500 hover:bg-slate-50"
                >
                  Clear
                </button>
              ) : null}
            </div>

            {showAccountList ? (
              <div className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                {filteredAccounts.length === 0 ? (
                  <div className="p-4 text-sm font-bold text-slate-400">
                    No account found.
                  </div>
                ) : (
                  filteredAccounts.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => selectAccount(a)}
                      className="block w-full rounded-xl px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      {getAccountLabel(a)}
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-slate-400">
              From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-black uppercase text-slate-400">
              To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={loadLedger}
              disabled={loadingLedger || loadingAccounts}
              className="flex-1 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingLedger ? "Loading..." : "Apply"}
            </button>

            <button
              onClick={resetFilters}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600 hover:bg-slate-50"
            >
              Reset
            </button>
          </div>

          <div className="space-y-1 md:col-span-5">
            <label className="text-xs font-black uppercase text-slate-400">
              Voucher / Description Search
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search voucher no, type, description..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none focus:border-indigo-400"
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <div className="no-print rounded-[2rem] border border-indigo-100 bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-900 p-6 text-white shadow-sm">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-300">
                AI Decision Widget
              </p>
              <h2 className="mt-2 text-2xl font-black">
                Ledger Anomaly Detector
              </h2>
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-300">
                {computed.aiDecision}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div
                className={`rounded-2xl px-5 py-3 text-center text-sm font-black ${
                  computed.aiRiskLevel === "High"
                    ? "bg-red-500 text-white"
                    : computed.aiRiskLevel === "Medium"
                      ? "bg-amber-400 text-slate-950"
                      : "bg-emerald-400 text-slate-950"
                }`}
              >
                Risk Level: {computed.aiRiskLevel}
              </div>

              <button
                onClick={saveAnomalyLogs}
                disabled={savingFlags || computed.flaggedLines.length === 0}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingFlags ? "Saving AI Flags..." : "Save AI Flags"}
              </button>

              {savedFlags > 0 ? (
                <p className="text-center text-xs font-bold text-emerald-300">
                  {savedFlags} anomaly flags saved permanently.
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-black uppercase text-slate-400">
                Flagged Transactions
              </p>
              <p className="mt-2 text-3xl font-black">
                {computed.flaggedLines.length}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-black uppercase text-slate-400">
                Highest Risk Score
              </p>
              <p className="mt-2 text-3xl font-black">
                {computed.highestRisk}/100
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-black uppercase text-slate-400">
                Average Movement
              </p>
              <p className="mt-2 text-2xl font-black">
                {money(computed.avgMovement)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-black uppercase text-slate-400">
                Imbalance Check
              </p>
              <p
                className={`mt-2 text-lg font-black ${
                  computed.imbalanceWarning ? "text-amber-300" : "text-emerald-300"
                }`}
              >
                {computed.imbalanceWarning ? "Review Needed" : "Normal"}
              </p>
            </div>
          </div>

          {computed.flaggedLines.length > 0 ? (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-red-300">
                Flagged Transaction Alerts
              </p>

              <div className="mt-4 grid gap-3">
                {computed.flaggedLines.slice(0, 5).map((line, i) => (
                  <button
                    key={line.id || i}
                    onClick={() => setSelectedLine(line)}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10"
                  >
                    <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                      <div>
                        <p className="font-black">
                          {getVoucherNo(line)} · {getLineDate(line).slice(0, 10) || "-"}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-300">
                          {(line.anomalyReasons || [])[0] || "Unusual movement detected."}
                        </p>
                      </div>

                      <div className="rounded-full bg-red-500 px-3 py-1 text-xs font-black text-white">
                        Risk {line.anomalyScore}/100
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="print-card rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase text-slate-400">Account</p>
            <p className="mt-2 text-lg font-black">{accountLabel}</p>
          </div>

          <div className="print-card rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase text-slate-400">
              Total Debit
            </p>
            <p className="mt-2 text-2xl font-black text-emerald-600">
              {money(computed.totalDebit)}
            </p>
          </div>

          <div className="print-card rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase text-slate-400">
              Total Credit
            </p>
            <p className="mt-2 text-2xl font-black text-red-600">
              {money(computed.totalCredit)}
            </p>
          </div>

          <div className="print-card rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase text-slate-400">
              Closing Balance
            </p>
            <p className="mt-2 text-2xl font-black">
              {money(computed.closingBalance)}
            </p>
            <p className="mt-1 text-xs font-black uppercase text-indigo-600">
              {computed.status}
            </p>
          </div>
        </div>

        <div className="no-print grid gap-4 md:grid-cols-4">
          <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase text-slate-400">
              Total Entries
            </p>
            <p className="mt-2 text-2xl font-black">{computed.entryCount}</p>
          </div>

          <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase text-slate-400">
              Debit Entries
            </p>
            <p className="mt-2 text-2xl font-black text-emerald-600">
              {computed.debitCount}
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase text-slate-400">
              Credit Entries
            </p>
            <p className="mt-2 text-2xl font-black text-red-600">
              {computed.creditCount}
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase text-slate-400">
              Largest Movement
            </p>
            <p className="mt-2 text-2xl font-black">
              {money(Math.max(computed.highestDebit, computed.highestCredit))}
            </p>
          </div>
        </div>

        <div className="print-card overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-black">Ledger Statement</h2>
              <p className="text-sm font-medium text-slate-500">
                Period: {dateFrom || "Start"} to {dateTo || "End"}
              </p>
            </div>

            <div className="rounded-full bg-slate-50 px-4 py-2 text-xs font-black uppercase text-slate-500">
              Click any row for voucher drill-down
            </div>
          </div>

          <div className="ledger-scroll overflow-x-auto scroll-smooth">
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="bg-slate-50 text-xs font-black uppercase text-slate-400">
                <tr>
                  <th className="p-4 text-left">AI</th>
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-left">Account</th>
                  <th className="p-4 text-left">Voucher</th>
                  <th className="p-4 text-left">Type</th>
                  <th className="p-4 text-left">Description</th>
                  <th className="p-4 text-right">Debit</th>
                  <th className="p-4 text-right">Credit</th>
                  <th className="p-4 text-right">Balance</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loadingLedger ? (
                  <tr>
                    <td colSpan={9} className="p-10 text-center font-bold text-slate-400">
                      Loading ledger...
                    </td>
                  </tr>
                ) : computed.lines.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-10 text-center font-bold text-slate-400">
                      No ledger entries found.
                    </td>
                  </tr>
                ) : (
                  computed.lines.map((row, index) => (
                    <tr
                      key={row.id || index}
                      onClick={() => setSelectedLine(row)}
                      className={`cursor-pointer ${
                        row.isFlagged
                          ? "bg-red-50 hover:bg-red-100"
                          : "hover:bg-indigo-50/60"
                      }`}
                    >
                      <td className="p-4">
                        {row.isFlagged ? (
                          <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">
                            Flag
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                            OK
                          </span>
                        )}
                      </td>

                      <td className="p-4 font-bold text-slate-600">
                        {getLineDate(row) ? getLineDate(row).slice(0, 10) : "-"}
                      </td>

                      <td className="p-4 font-bold text-slate-700">
                        {getLineAccountCode(row)}{" "}
                        <span className="font-medium text-slate-400">
                          {getLineAccountName(row)}
                        </span>
                      </td>

                      <td className="p-4 font-black">{getVoucherNo(row)}</td>

                      <td className="p-4">
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase text-indigo-600">
                          {row.voucher_type || "Entry"}
                        </span>
                      </td>

                      <td className="p-4 font-medium text-slate-600">
                        {getDescription(row)}
                        {row.isFlagged ? (
                          <p className="mt-1 text-xs font-black text-red-600">
                            {(row.anomalyReasons || [])[0]}
                          </p>
                        ) : null}
                      </td>

                      <td className="p-4 text-right font-black text-emerald-600">
                        {Number(row.debit) ? money(Number(row.debit)) : "-"}
                      </td>

                      <td className="p-4 text-right font-black text-red-600">
                        {Number(row.credit) ? money(Number(row.credit)) : "-"}
                      </td>

                      <td className="p-4 text-right font-black">
                        {money(Number(row.runningBalance) || 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              <tfoot className="bg-slate-950 text-sm font-black text-white">
                <tr>
                  <td colSpan={6} className="p-4 text-right">
                    Grand Total
                  </td>
                  <td className="p-4 text-right">{money(computed.totalDebit)}</td>
                  <td className="p-4 text-right">{money(computed.totalCredit)}</td>
                  <td className="p-4 text-right">{money(computed.closingBalance)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {selectedLine ? (
        <div className="no-print fixed inset-0 z-50 flex justify-end bg-slate-950/40">
          <button
            aria-label="Close drawer"
            className="absolute inset-0"
            onClick={() => setSelectedLine(null)}
          />

          <div className="relative h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
                  Voucher Drill-down
                </p>
                <h3 className="mt-2 text-2xl font-black">
                  {getVoucherNo(selectedLine)}
                </h3>
                <p className="text-sm font-medium text-slate-500">
                  {selectedLine.voucher_type || "Entry"} ·{" "}
                  {getLineDate(selectedLine)
                    ? getLineDate(selectedLine).slice(0, 10)
                    : "-"}
                </p>
              </div>

              <button
                onClick={() => setSelectedLine(null)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              {selectedLine.isFlagged ? (
                <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-5">
                  <p className="text-xs font-black uppercase text-red-700">
                    AI Anomaly Alert
                  </p>
                  <p className="mt-2 text-2xl font-black text-red-700">
                    Risk Score {selectedLine.anomalyScore}/100
                  </p>
                  <p className="mt-1 text-xs font-black uppercase text-red-600">
                    Risk Level: {getRiskLevel(Number(selectedLine.anomalyScore) || 0)}
                  </p>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-sm font-semibold text-red-700">
                    {(selectedLine.anomalyReasons || []).map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5">
                  <p className="text-xs font-black uppercase text-emerald-700">
                    AI Review
                  </p>
                  <p className="mt-2 text-lg font-black text-emerald-700">
                    No major anomaly detected for this ledger line.
                  </p>
                </div>
              )}

              <div className="rounded-[1.5rem] bg-slate-50 p-5">
                <p className="text-xs font-black uppercase text-slate-400">
                  Account
                </p>
                <p className="mt-2 text-lg font-black">
                  {getLineAccountCode(selectedLine)} -{" "}
                  {getLineAccountName(selectedLine) || "Unknown Account"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
                  <p className="text-xs font-black uppercase text-emerald-700">
                    Debit
                  </p>
                  <p className="mt-2 text-2xl font-black text-emerald-700">
                    {money(Number(selectedLine.debit) || 0)}
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-red-100 bg-red-50 p-5">
                  <p className="text-xs font-black uppercase text-red-700">
                    Credit
                  </p>
                  <p className="mt-2 text-2xl font-black text-red-700">
                    {money(Number(selectedLine.credit) || 0)}
                  </p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <p className="text-xs font-black uppercase text-slate-400">
                  Running Balance After This Entry
                </p>
                <p className="mt-2 text-2xl font-black">
                  {money(Number(selectedLine.runningBalance) || 0)}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <p className="text-xs font-black uppercase text-slate-400">
                  Narration
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  {getDescription(selectedLine)}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <p className="text-xs font-black uppercase text-slate-400">
                  Permanent AI Log
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Use “Save AI Flags” to store this flagged transaction in
                  ledger_anomaly_logs for audit review and investigation workflow.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <p className="text-xs font-black uppercase text-slate-400">
                  System Reference
                </p>
                <div className="mt-3 space-y-2 text-sm font-bold text-slate-600">
                  <p>Voucher ID: {selectedLine.voucher_id || "-"}</p>
                  <p>Line ID: {selectedLine.id || "-"}</p>
                  <p>Date: {getLineDate(selectedLine) || "-"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}