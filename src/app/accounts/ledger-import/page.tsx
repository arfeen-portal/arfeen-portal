"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ImportBatch = {
  id: string;
  file_name: string;
  status: string;
  total_rows?: number;
  ready_rows?: number;
  review_rows?: number;
  duplicate_rows?: number;
  created_at?: string;
};

type ImportRow = {
  id: string;
  batch_id: string;
  entry_date?: string;
  description?: string;
  debit?: number;
  credit?: number;
  amount?: number;
  debit_account?: string;
  credit_account?: string;
  reference_no?: string;
  narration?: string;
  status?: string;
  issue_notes?: string[];
  confidence_score?: number;
  duplicate_key?: string;
  created_at?: string;
};

type Account = {
  id: string;
  code?: string;
  name: string;
  type?: string;
  is_active?: boolean;
};

type ApiState = {
  loading: boolean;
  saving: boolean;
  uploading: boolean;
  error: string;
  success: string;
};

const STATUS_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Ready", value: "ready" },
  { label: "Needs Review", value: "needs_review" },
  { label: "Duplicate", value: "duplicate" },
  { label: "Approved", value: "approved" },
  { label: "Rolled Back", value: "rolled_back" },
];

const FALLBACK_ACCOUNTS = [
  "Cash Account",
  "Bank Account",
  "Agent Receivable",
  "Supplier Payable",
  "Sales Revenue",
  "Transport Expense",
  "Hotel Expense",
  "Airline Expense",
  "Visa Expense",
  "Suspense Account",
];

function formatMoney(value?: number) {
  const n = Number(value || 0);
  return n.toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  });
}

function statusClass(status?: string) {
  if (status === "ready") return "bg-emerald-500/15 text-emerald-300 border-emerald-400/20";
  if (status === "approved") return "bg-blue-500/15 text-blue-300 border-blue-400/20";
  if (status === "duplicate") return "bg-amber-500/15 text-amber-300 border-amber-400/20";
  if (status === "rolled_back") return "bg-slate-500/15 text-slate-300 border-slate-400/20";
  return "bg-rose-500/15 text-rose-300 border-rose-400/20";
}

function confidenceClass(score?: number) {
  const n = Number(score || 0);
  if (n >= 85) return "bg-emerald-400";
  if (n >= 60) return "bg-amber-400";
  return "bg-rose-400";
}

export default function LedgerImportPage() {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [state, setState] = useState<ApiState>({
    loading: true,
    saving: false,
    uploading: false,
    error: "",
    success: "",
  });

  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [selectedBatch, setSelectedBatch] = useState("");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const accountOptions = useMemo(() => {
    const live = accounts
      .filter((account) => account.is_active !== false)
      .map((account) => account.name)
      .filter(Boolean);

    const merged = Array.from(new Set([...live, ...FALLBACK_ACCOUNTS]));
    return merged.sort((a, b) => a.localeCompare(b));
  }, [accounts]);

  const selectedIds = useMemo(
    () => Object.entries(selectedRows).filter(([, checked]) => checked).map(([id]) => id),
    [selectedRows]
  );

  const summary = useMemo(() => {
    const total = rows.length;
    const ready = rows.filter((row) => row.status === "ready").length;
    const review = rows.filter((row) => row.status === "needs_review").length;
    const duplicate = rows.filter((row) => row.status === "duplicate").length;
    const approved = rows.filter((row) => row.status === "approved").length;
    const debit = rows.reduce((sum, row) => sum + Number(row.debit || 0), 0);
    const credit = rows.reduce((sum, row) => sum + Number(row.credit || 0), 0);
    const avgConfidence = total
      ? Math.round(rows.reduce((sum, row) => sum + Number(row.confidence_score || 0), 0) / total)
      : 0;

    return {
      total,
      ready,
      review,
      duplicate,
      approved,
      debit,
      credit,
      difference: debit - credit,
      avgConfidence,
    };
  }, [rows]);

  const repairRows = useMemo(() => {
    return rows.filter((row) => row.status === "needs_review" || row.status === "duplicate");
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = search.toLowerCase().trim();

    return rows.filter((row) => {
      const statusMatch = status === "all" || row.status === status;
      const searchMatch =
        !q ||
        row.description?.toLowerCase().includes(q) ||
        row.reference_no?.toLowerCase().includes(q) ||
        row.debit_account?.toLowerCase().includes(q) ||
        row.credit_account?.toLowerCase().includes(q);

      return statusMatch && searchMatch;
    });
  }, [rows, search, status]);

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: "", success: "" }));

    try {
      const params = new URLSearchParams();
      if (selectedBatch) params.set("batch_id", selectedBatch);
      if (status) params.set("status", status);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/accounts/ledger-import?${params.toString()}`, {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to load ledger import data");
      }

      setBatches(json.batches || []);
      setRows(json.rows || []);
      setAccounts(json.accounts || []);
      setSelectedRows({});
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to load data",
      }));
    } finally {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [selectedBatch, status, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchData();
    }, 350);

    return () => window.clearTimeout(timer);
  }, [fetchData]);

  async function uploadFile(file: File) {
    setState((prev) => ({ ...prev, uploading: true, error: "", success: "" }));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/accounts/ledger-import", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Upload failed");
      }

      setSelectedBatch(json.batch_id);
      setState((prev) => ({
        ...prev,
        success: `Import completed: ${json.total_rows} rows, ${json.ready_rows} ready, ${json.review_rows} need review, ${json.duplicate_rows} duplicates.`,
      }));

      await fetchData();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Upload failed",
      }));
    } finally {
      setState((prev) => ({ ...prev, uploading: false }));
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function patchAction(payload: Record<string, unknown>) {
    const res = await fetch("/api/accounts/ledger-import", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok || !json.ok) {
      throw new Error(json.error || "Update failed");
    }

    return json;
  }

  async function updateRow(rowId: string, field: keyof ImportRow, value: string | number) {
    const previousRows = rows;

    setRows((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [field]: value,
              status: field === "status" ? String(value) : "ready",
              issue_notes: [],
              confidence_score: 100,
            }
          : row
      )
    );

    try {
      const json = await patchAction({
        action: "update_row",
        row_id: rowId,
        field,
        value,
      });

      if (json.row) {
        setRows((current) => current.map((row) => (row.id === rowId ? json.row : row)));
      }
    } catch (error) {
      setRows(previousRows);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Row update failed",
      }));
    }
  }

  async function bulkMarkReady() {
    if (!selectedIds.length) return;

    setState((prev) => ({ ...prev, saving: true, error: "", success: "" }));

    try {
      await patchAction({
        action: "mark_ready",
        row_ids: selectedIds,
      });

      setState((prev) => ({
        ...prev,
        success: `${selectedIds.length} rows marked ready.`,
      }));

      await fetchData();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Bulk ready failed",
      }));
    } finally {
      setState((prev) => ({ ...prev, saving: false }));
    }
  }

  async function approveRows() {
    if (!selectedIds.length) return;

    setState((prev) => ({ ...prev, saving: true, error: "", success: "" }));

    try {
      await patchAction({
        action: "approve_rows",
        row_ids: selectedIds,
      });

      setState((prev) => ({
        ...prev,
        success: `${selectedIds.length} rows approved successfully.`,
      }));

      await fetchData();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Approval failed",
      }));
    } finally {
      setState((prev) => ({ ...prev, saving: false }));
    }
  }

  async function rollbackRows() {
    if (!selectedIds.length) return;

    setState((prev) => ({ ...prev, saving: true, error: "", success: "" }));

    try {
      await patchAction({
        action: "rollback_rows",
        row_ids: selectedIds,
      });

      setState((prev) => ({
        ...prev,
        success: `${selectedIds.length} rows rolled back.`,
      }));

      await fetchData();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Rollback failed",
      }));
    } finally {
      setState((prev) => ({ ...prev, saving: false }));
    }
  }

  function toggleAllVisible(checked: boolean) {
    const next = { ...selectedRows };
    filteredRows.forEach((row) => {
      next[row.id] = checked;
    });
    setSelectedRows(next);
  }

  function printLedger() {
    window.print();
  }

  function exportCsv() {
    const headers = [
      "Date",
      "Reference",
      "Description",
      "Debit",
      "Credit",
      "Debit Account",
      "Credit Account",
      "Status",
      "Confidence",
      "Issues",
    ];

    const body = filteredRows.map((row) => [
      row.entry_date || "",
      row.reference_no || "",
      row.description || "",
      row.debit || 0,
      row.credit || 0,
      row.debit_account || "",
      row.credit_account || "",
      row.status || "",
      row.confidence_score || 0,
      (row.issue_notes || []).join(" | "),
    ]);

    const csv = [headers, ...body]
      .map((line) =>
        line
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `ledger-import-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-blue-200">
                Audit Ready Ledger Import
              </div>

              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                Smart Ledger Import & Repair Center
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                Upload ledger CSV, repair missing accounts inline, detect duplicates, approve clean
                rows, and keep import data audit-ready before posting into accounts.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadFile(file);
                }}
              />

              <button
                onClick={() => fileRef.current?.click()}
                disabled={state.uploading}
                className="rounded-2xl bg-blue-500 px-4 py-2 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {state.uploading ? "Uploading..." : "Upload CSV"}
              </button>

              <button
                onClick={fetchData}
                disabled={state.loading}
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-slate-100 hover:bg-white/[0.1]"
              >
                Refresh
              </button>

              <button
                onClick={exportCsv}
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-slate-100 hover:bg-white/[0.1]"
              >
                Export CSV
              </button>

              <button
                onClick={printLedger}
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-slate-100 hover:bg-white/[0.1]"
              >
                Print
              </button>
            </div>
          </div>
        </section>

        {state.error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm font-semibold text-rose-200">
            {state.error}
          </div>
        ) : null}

        {state.success ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-200">
            {state.success}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Rows</p>
            <p className="mt-2 text-3xl font-black">{summary.total}</p>
            <p className="mt-1 text-xs text-slate-400">Current working set</p>
          </div>

          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-200">Ready</p>
            <p className="mt-2 text-3xl font-black text-emerald-100">{summary.ready}</p>
            <p className="mt-1 text-xs text-emerald-200/70">Clean rows</p>
          </div>

          <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-rose-200">
              Needs Repair
            </p>
            <p className="mt-2 text-3xl font-black text-rose-100">{summary.review}</p>
            <p className="mt-1 text-xs text-rose-200/70">Missing or invalid data</p>
          </div>

          <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-200">
              Duplicates
            </p>
            <p className="mt-2 text-3xl font-black text-amber-100">{summary.duplicate}</p>
            <p className="mt-1 text-xs text-amber-200/70">Possible duplicate entries</p>
          </div>

          <div className="rounded-3xl border border-blue-400/20 bg-blue-500/10 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
              Confidence
            </p>
            <p className="mt-2 text-3xl font-black text-blue-100">{summary.avgConfidence}%</p>
            <p className="mt-1 text-xs text-blue-200/70">AI mapping quality</p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 lg:col-span-2">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-black">Controls</h2>
                <p className="text-sm text-slate-400">
                  Select a batch, filter rows, repair accounts, then approve.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={bulkMarkReady}
                  disabled={!selectedIds.length || state.saving}
                  className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Mark Ready
                </button>

                <button
                  onClick={approveRows}
                  disabled={!selectedIds.length || state.saving}
                  className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Approve Selected
                </button>

                <button
                  onClick={rollbackRows}
                  disabled={!selectedIds.length || state.saving}
                  className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-black text-rose-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Rollback
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <label className="space-y-1">
                <span className="text-xs font-bold uppercase text-slate-400">Batch</span>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-blue-400"
                >
                  <option value="">All batches</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.file_name} — {batch.status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-bold uppercase text-slate-400">Status</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-blue-400"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-xs font-bold uppercase text-slate-400">Search</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Description, ref, account..."
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none placeholder:text-slate-600 focus:border-blue-400"
                />
              </label>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-lg font-black">Balance Check</h2>
            <p className="mt-1 text-sm text-slate-400">Debit and credit validation.</p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] p-3">
                <span className="text-sm text-slate-300">Debit</span>
                <span className="font-black">{formatMoney(summary.debit)}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] p-3">
                <span className="text-sm text-slate-300">Credit</span>
                <span className="font-black">{formatMoney(summary.credit)}</span>
              </div>

              <div
                className={`flex items-center justify-between rounded-2xl p-3 ${
                  Math.abs(summary.difference) <= 0.01
                    ? "bg-emerald-500/10 text-emerald-200"
                    : "bg-rose-500/10 text-rose-200"
                }`}
              >
                <span className="text-sm">Difference</span>
                <span className="font-black">{formatMoney(summary.difference)}</span>
              </div>
            </div>
          </div>
        </section>

        {repairRows.length ? (
          <section className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-black text-amber-100">Repair Queue</h2>
                <p className="text-sm text-amber-100/70">
                  {repairRows.length} rows need action before approval.
                </p>
              </div>

              <button
                onClick={() => {
                  setStatus("needs_review");
                  window.scrollTo({ top: 650, behavior: "smooth" });
                }}
                className="rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-2 text-sm font-black text-amber-100"
              >
                Review Now
              </button>
            </div>
          </section>
        ) : null}

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-3 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black">Imported Ledger Rows</h2>
              <p className="text-sm text-slate-400">
                {filteredRows.length} visible rows. {selectedIds.length} selected.
              </p>
            </div>

            <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-300">
              <input
                type="checkbox"
                checked={filteredRows.length > 0 && filteredRows.every((row) => selectedRows[row.id])}
                onChange={(e) => toggleAllVisible(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-slate-900"
              />
              Select visible
            </label>
          </div>

          <div className="overflow-auto">
            <table className="min-w-[1500px] w-full text-left text-sm">
              <thead className="bg-white/[0.05] text-[11px] uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="w-10 p-3"></th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Debit</th>
                  <th className="p-3 text-right">Credit</th>
                  <th className="p-3">Debit Account</th>
                  <th className="p-3">Credit Account</th>
                  <th className="p-3">Confidence</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {state.loading ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400">
                      Loading ledger import data...
                    </td>
                  </tr>
                ) : filteredRows.length ? (
                  filteredRows.map((row) => {
                    const isExpanded = expandedRow === row.id;

                    return (
                      <>
                        <tr
                          key={row.id}
                          className="border-t border-white/10 align-top transition hover:bg-white/[0.03]"
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={Boolean(selectedRows[row.id])}
                              onChange={(e) =>
                                setSelectedRows((prev) => ({
                                  ...prev,
                                  [row.id]: e.target.checked,
                                }))
                              }
                              className="h-4 w-4 rounded border-white/20 bg-slate-900"
                            />
                          </td>

                          <td className="p-3">
                            <input
                              type="date"
                              value={row.entry_date || ""}
                              onChange={(e) => updateRow(row.id, "entry_date", e.target.value)}
                              className="w-36 rounded-xl border border-white/10 bg-slate-900 px-2 py-1 text-xs outline-none focus:border-blue-400"
                            />
                          </td>

                          <td className="p-3">
                            <input
                              value={row.reference_no || ""}
                              onChange={(e) => updateRow(row.id, "reference_no", e.target.value)}
                              placeholder="Ref"
                              className="w-32 rounded-xl border border-white/10 bg-slate-900 px-2 py-1 text-xs outline-none placeholder:text-slate-600 focus:border-blue-400"
                            />
                          </td>

                          <td className="p-3">
                            <textarea
                              value={row.description || ""}
                              onChange={(e) => updateRow(row.id, "description", e.target.value)}
                              rows={2}
                              className="w-80 rounded-xl border border-white/10 bg-slate-900 px-2 py-1 text-xs leading-5 outline-none focus:border-blue-400"
                            />
                          </td>

                          <td className="p-3 text-right">
                            <input
                              type="number"
                              value={row.debit || 0}
                              onChange={(e) => updateRow(row.id, "debit", Number(e.target.value))}
                              className="w-28 rounded-xl border border-white/10 bg-slate-900 px-2 py-1 text-right text-xs outline-none focus:border-blue-400"
                            />
                          </td>

                          <td className="p-3 text-right">
                            <input
                              type="number"
                              value={row.credit || 0}
                              onChange={(e) => updateRow(row.id, "credit", Number(e.target.value))}
                              className="w-28 rounded-xl border border-white/10 bg-slate-900 px-2 py-1 text-right text-xs outline-none focus:border-blue-400"
                            />
                          </td>

                          <td className="p-3">
                            <select
                              value={row.debit_account || ""}
                              onChange={(e) => updateRow(row.id, "debit_account", e.target.value)}
                              className="w-52 rounded-xl border border-white/10 bg-slate-900 px-2 py-1 text-xs outline-none focus:border-blue-400"
                            >
                              <option value="">Select debit account</option>
                              {accountOptions.map((account) => (
                                <option key={account} value={account}>
                                  {account}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="p-3">
                            <select
                              value={row.credit_account || ""}
                              onChange={(e) => updateRow(row.id, "credit_account", e.target.value)}
                              className="w-52 rounded-xl border border-white/10 bg-slate-900 px-2 py-1 text-xs outline-none focus:border-blue-400"
                            >
                              <option value="">Select credit account</option>
                              {accountOptions.map((account) => (
                                <option key={account} value={account}>
                                  {account}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="p-3">
                            <div className="w-28">
                              <div className="mb-1 flex items-center justify-between text-[10px] text-slate-400">
                                <span>Score</span>
                                <span>{row.confidence_score || 0}%</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                <div
                                  className={`h-full ${confidenceClass(row.confidence_score)}`}
                                  style={{
                                    width: `${Math.max(0, Math.min(100, Number(row.confidence_score || 0)))}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="p-3">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(
                                row.status
                              )}`}
                            >
                              {row.status || "unknown"}
                            </span>
                          </td>

                          <td className="p-3">
                            <button
                              onClick={() => setExpandedRow(isExpanded ? null : row.id)}
                              className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/[0.1]"
                            >
                              {isExpanded ? "Hide" : "Details"}
                            </button>
                          </td>
                        </tr>

                        {isExpanded ? (
                          <tr className="border-t border-white/10 bg-slate-900/70">
                            <td colSpan={11} className="p-4">
                              <div className="grid gap-4 lg:grid-cols-3">
                                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                  <h3 className="text-sm font-black">Issues</h3>
                                  {row.issue_notes?.length ? (
                                    <ul className="mt-3 space-y-2 text-sm text-rose-200">
                                      {row.issue_notes.map((issue) => (
                                        <li key={issue}>• {issue}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="mt-3 text-sm text-emerald-200">
                                      No active issue found.
                                    </p>
                                  )}
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                  <h3 className="text-sm font-black">Narration</h3>
                                  <textarea
                                    value={row.narration || ""}
                                    onChange={(e) => updateRow(row.id, "narration", e.target.value)}
                                    rows={4}
                                    className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-400"
                                  />
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                  <h3 className="text-sm font-black">Quick Repair</h3>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                      onClick={() => updateRow(row.id, "debit_account", "Suspense Account")}
                                      className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-bold"
                                    >
                                      Debit Suspense
                                    </button>

                                    <button
                                      onClick={() => updateRow(row.id, "credit_account", "Suspense Account")}
                                      className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-bold"
                                    >
                                      Credit Suspense
                                    </button>

                                    <button
                                      onClick={() => {
                                        setSelectedRows((prev) => ({ ...prev, [row.id]: true }));
                                        setExpandedRow(null);
                                      }}
                                      className="rounded-xl bg-blue-500 px-3 py-2 text-xs font-black text-white"
                                    >
                                      Select Row
                                    </button>
                                  </div>

                                  <p className="mt-3 text-xs leading-5 text-slate-400">
                                    Suspense Account sirf temporary use karein. Final approval se pehle
                                    actual account select karna better hai.
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400">
                      No rows found. Upload CSV or change filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="text-lg font-black">Recommended CSV Columns</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Best result ke liye file mein ye columns rakhein:{" "}
            <span className="font-bold text-slate-200">
              Date, Description, Debit, Credit, Reference
            </span>
            . System alternate headers bhi detect karta hai: particulars, narration, dr, cr,
            amount, voucher_no, transaction_id.
          </p>
        </section>
      </div>
    </main>
  );
}