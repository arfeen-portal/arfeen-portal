"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Upload,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  FileText,
} from "lucide-react";
import jsPDF from "jspdf";

type StagingRow = {
  id: string;
  customer_name: string | null;
  supplier_name: string | null;
  booking_ref: string | null;
  amount: number | null;
  paid: number | null;
  balance: number | null;
  currency: string | null;
  status: string;
  raw_data?: Record<string, any> | null;
};

const SYSTEM_FIELDS = [
  "customer_name",
  "supplier_name",
  "booking_ref",
  "amount",
  "paid",
  "currency",
] as const;

type SystemField = (typeof SYSTEM_FIELDS)[number];

export default function MigrationPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const [fileColumns, setFileColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<SystemField, string | null>>({
    customer_name: null,
    supplier_name: null,
    booking_ref: null,
    amount: null,
    paid: null,
    currency: null,
  });

  const [rows, setRows] = useState<StagingRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [autoMatching, setAutoMatching] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [summary, setSummary] = useState<{
    total: number;
    imported: number;
    duplicates: number;
    skipped: number;
  } | null>(null);

  // ---------- STEP 1: UPLOAD ----------

  const handleUpload = async () => {
    if (!file) return alert("Please select a file first.");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch("/api/migration/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Upload failed");
        return;
      }
      setJobId(data.jobId);
      await loadPreview(data.jobId);
      setStep(2);
    } finally {
      setUploading(false);
    }
  };

  const loadPreview = async (jobId: string) => {
    const res = await fetch(`/api/migration/staging?jobId=${jobId}&limit=1`);
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to load preview");
      return;
    }
    const first: StagingRow | undefined = data.rows?.[0];
    if (first?.raw_data) {
      const cols = Object.keys(first.raw_data);
      setFileColumns(cols);
      const lowerCols = cols.map((c) => c.toLowerCase());
      const guess = (needles: string[]) =>
        cols[
          lowerCols.findIndex((c) =>
            needles.some((n) => c.includes(n)),
          )
        ] || null;

      setMapping({
        customer_name: guess(["customer", "client", "party"]),
        supplier_name: guess(["supplier", "vendor"]),
        booking_ref: guess(["ref", "booking", "invoice"]),
        amount: guess(["amount", "total", "debit", "credit"]),
        paid: guess(["paid", "received"]),
        currency: guess(["currency", "curr", "ccy"]),
      });
    }
  };

  // ---------- DRAG & DROP FOR MAPPING ----------

  const [draggingCol, setDraggingCol] = useState<string | null>(null);

  const handleDragStart = (col: string) => {
    setDraggingCol(col);
  };

  const handleDropOnField = (field: SystemField) => {
    if (!draggingCol) return;
    setMapping((prev) => ({ ...prev, [field]: draggingCol }));
    setDraggingCol(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const applyMapping = async () => {
    if (!jobId) return;
    const res = await fetch("/api/migration/apply-mapping", {
      method: "POST",
      body: JSON.stringify({ jobId, mapping }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to apply mapping");
      return;
    }
    await loadRows(jobId);
    setStep(3);
  };

  // ---------- LOAD FULL ROWS (STEP 3) ----------

  const loadRows = async (jobId: string) => {
    setLoadingRows(true);
    try {
      const res = await fetch(`/api/migration/staging?jobId=${jobId}&limit=500`);
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to load rows");
        return;
      }
      setRows(data.rows || []);
      setSelectedIds([]);
    } finally {
      setLoadingRows(false);
    }
  };

  // ---------- DUPLICATE DETECTION ----------

  const duplicateGroups = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const r of rows) {
      const key =
        (r.customer_name || "").toLowerCase().trim() +
        "|" +
        (r.booking_ref || "").toLowerCase().trim();
      if (!key.trim()) continue;
      const list = map.get(key) || [];
      list.push(r.id);
      map.set(key, list);
    }
    const result: Record<string, string[]> = {};
    for (const [key, ids] of Array.from(map.entries())) {
      if (ids.length > 1) {
        result[key] = ids;
      }
    }
    return result;
  }, [rows]);

  const isDuplicateRow = (id: string) =>
    Object.values(duplicateGroups).some((ids) => ids.includes(id));

  const duplicateCount = useMemo(
    () =>
      Object.values(duplicateGroups).reduce(
        (sum, ids) => sum + (ids.length - 1),
        0,
      ),
    [duplicateGroups],
  );

  // ---------- AUTO MATCHING ----------

  const runAutoMatch = async () => {
    if (!jobId) return;
    setAutoMatching(true);
    try {
      const res = await fetch("/api/migration/auto-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Auto match failed");
        return;
      }
      await loadRows(jobId);
    } finally {
      setAutoMatching(false);
    }
  };

  // ---------- BULK STATUS ----------

  const updateBulkStatus = async (status: string) => {
    if (!jobId || !selectedIds.length) return;
    const res = await fetch("/api/migration/bulk-status", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, ids: selectedIds, status }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Bulk update failed");
      return;
    }
    await loadRows(jobId);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectAllVisible = () => {
    setSelectedIds(rows.map((r) => r.id));
  };

  const clearSelection = () => setSelectedIds([]);

  // ---------- COMMIT + SUMMARY + PDF ----------

  const handleCommit = async () => {
    if (!jobId) return;
    setCommitting(true);
    try {
      const res = await fetch("/api/migration/commit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Commit failed");
        return;
      }
      const total = rows.length;
      const imported = rows.filter((r) => r.status === "matched").length;
      const skipped = total - imported;
      setSummary({
        total,
        imported,
        duplicates: duplicateCount,
        skipped,
      });
      setStep(4);
    } finally {
      setCommitting(false);
    }
  };

  const downloadPdf = () => {
    if (!summary || !jobId) return;
    const doc = new jsPDF();

    let y = 15;
    doc.setFontSize(14);
    doc.text("Arfeen Portal - Agent Data Migration Summary", 10, y);
    y += 10;
    doc.setFontSize(11);
    doc.text(`Job ID: ${jobId}`, 10, y);
    y += 7;
    doc.text(`Total rows in file: ${summary.total}`, 10, y);
    y += 7;
    doc.text(`Imported (matched): ${summary.imported}`, 10, y);
    y += 7;
    doc.text(`Duplicates detected: ${summary.duplicates}`, 10, y);
    y += 7;
    doc.text(`Skipped / not imported: ${summary.skipped}`, 10, y);
    y += 10;
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 10, y);

    doc.save(`migration-summary-${jobId}.pdf`);
  };

  // ---------- RENDER ----------

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agent Data Migration (Pro)</h1>
          <p className="text-sm text-gray-500">
            Excel/CSV → Auto mapping → Smart matching → Duplicate control → PDF
            report
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`px-3 py-1 rounded-full ${
              step === 1 ? "bg-blue-600 text-white" : "bg-gray-100"
            }`}
          >
            1. Upload
          </span>
          <span
            className={`px-3 py-1 rounded-full ${
              step === 2 ? "bg-blue-600 text-white" : "bg-gray-100"
            }`}
          >
            2. Mapping
          </span>
          <span
            className={`px-3 py-1 rounded-full ${
              step === 3 ? "bg-blue-600 text-white" : "bg-gray-100"
            }`}
          >
            3. Review & Merge
          </span>
          <span
            className={`px-3 py-1 rounded-full ${
              step === 4 ? "bg-blue-600 text-white" : "bg-gray-100"
            }`}
          >
            4. Import & PDF
          </span>
        </div>
      </div>

      {/* STEP 1 – UPLOAD */}
      {step === 1 && (
        <div className="border rounded-xl p-6 space-y-4 bg-white">
          <label className="flex items-center gap-3 border-2 border-dashed p-6 cursor-pointer rounded-lg">
            <Upload />
            <input
              type="file"
              hidden
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <span className="text-sm">
              {file ? file.name : "Choose CSV/Excel File"}
            </span>
          </label>

          <button
            disabled={!file || uploading}
            onClick={handleUpload}
            className="mt-3 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm"
          >
            {uploading ? "Uploading..." : "Start Migration"}
          </button>
        </div>
      )}

      {/* STEP 2 – COLUMN MAPPING (DRAG & DROP) */}
      {step === 2 && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="border rounded-xl p-4 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4" />
              <h2 className="font-semibold text-sm">File Columns</h2>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              In headers ko drag karke right side fields pe drop karo.
            </p>
            <div className="flex flex-wrap gap-2">
              {fileColumns.map((col) => (
                <div
                  key={col}
                  draggable
                  onDragStart={() => handleDragStart(col)}
                  className="px-3 py-1 text-xs border rounded-full cursor-move bg-gray-50"
                >
                  {col}
                </div>
              ))}
              {!fileColumns.length && (
                <p className="text-xs text-gray-400">
                  Preview row nahi mili – wapis ja kar file dobara upload karein.
                </p>
              )}
            </div>
          </div>

          <div className="border rounded-xl p-4 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4" />
              <h2 className="font-semibold text-sm">System Fields</h2>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Har system field ke sath ek file column map karein.
            </p>
            <div className="space-y-2">
              {SYSTEM_FIELDS.map((field) => (
                <div key={field} className="flex items-center gap-2">
                  <div className="w-32 text-xs font-medium capitalize">
                    {field.replace("_", " ")}
                  </div>
                  <div
                    onDragOver={handleDragOver}
                    onDrop={() => handleDropOnField(field)}
                    className="flex-1 h-9 flex items-center px-3 text-xs border rounded-lg bg-gray-50"
                  >
                    {mapping[field] ? (
                      <span>{mapping[field]}</span>
                    ) : (
                      <span className="text-gray-400">Drop a column here</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="text-xs px-4 py-2 border rounded-lg"
              >
                ← Back
              </button>
              <button
                onClick={applyMapping}
                disabled={!jobId}
                className="text-xs px-4 py-2 rounded-lg bg-blue-600 text-white"
              >
                Apply Mapping &amp; Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 – REVIEW & DUPLICATE + AUTO MATCH */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>
                Auto matching + duplicates control. Jo rows <b>matched</b> hongi
                wohi import hongi.
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => jobId && loadRows(jobId)}
                className="text-xs px-3 py-1 border rounded-lg"
              >
                Reload
              </button>
              <button
                onClick={runAutoMatch}
                disabled={autoMatching || !jobId}
                className="text-xs px-3 py-1 rounded-lg bg-blue-600 text-white flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                {autoMatching ? "Matching..." : "Run Smart Match"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div>
              Total rows: <b>{rows.length}</b> · Duplicates:{" "}
              <b>{duplicateCount}</b>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllVisible}
                className="px-2 py-1 border rounded"
              >
                Select all
              </button>
              <button
                onClick={clearSelection}
                className="px-2 py-1 border rounded"
              >
                Clear
              </button>
              {selectedIds.length > 0 && (
                <span>
                  Selected: <b>{selectedIds.length}</b>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => updateBulkStatus("duplicate_skipped")}
              disabled={!selectedIds.length}
              className="px-3 py-1 rounded-lg border border-amber-400 bg-amber-50"
            >
              Mark as duplicate / skip
            </button>
            <button
              onClick={() => updateBulkStatus("matched")}
              disabled={!selectedIds.length}
              className="px-3 py-1 rounded-lg border border-green-500 bg-green-50"
            >
              Force mark as matched
            </button>
            <button
              onClick={() => updateBulkStatus("needs_review")}
              disabled={!selectedIds.length}
              className="px-3 py-1 rounded-lg border bg-gray-50"
            >
              Mark as needs review
            </button>
          </div>

          <div className="border rounded-xl bg-white overflow-auto max-h-[480px]">
            {loadingRows ? (
              <div className="p-4 text-xs text-gray-500">Loading rows…</div>
            ) : (
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left">
                      <input
                        type="checkbox"
                        onChange={(e) =>
                          e.target.checked ? selectAllVisible() : clearSelection()
                        }
                      />
                    </th>
                    <th className="px-2 py-2 text-left">Customer</th>
                    <th className="px-2 py-2 text-left">Supplier</th>
                    <th className="px-2 py-2 text-left">Ref</th>
                    <th className="px-2 py-2 text-right">Amount</th>
                    <th className="px-2 py-2 text-right">Paid</th>
                    <th className="px-2 py-2 text-right">Balance</th>
                    <th className="px-2 py-2 text-left">Currency</th>
                    <th className="px-2 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const dup = isDuplicateRow(row.id);
                    const selected = selectedIds.includes(row.id);
                    return (
                      <tr
                        key={row.id}
                        className={`border-t ${
                          dup
                            ? "bg-yellow-50"
                            : row.status === "matched"
                            ? "bg-green-50"
                            : ""
                        }`}
                      >
                        <td className="px-2 py-1">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleSelect(row.id)}
                          />
                        </td>
                        <td className="px-2 py-1">
                          {row.customer_name || (
                            <span className="text-gray-400">—</span>
                          )}
                          {dup && (
                            <span className="ml-1 text-[10px] text-amber-600">
                              DUP
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-1">
                          {row.supplier_name || (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-2 py-1">
                          {row.booking_ref || (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {row.amount ?? "-"}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {row.paid ?? "-"}
                        </td>
                        <td className="px-2 py-1 text-right">
                          {row.balance ?? "-"}
                        </td>
                        <td className="px-2 py-1">{row.currency || "-"}</td>
                        <td className="px-2 py-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] ${
                              row.status === "matched"
                                ? "bg-green-100 text-green-700"
                                : row.status === "duplicate_skipped"
                                ? "bg-amber-100 text-amber-700"
                                : row.status === "needs_review"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {!rows.length && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-4 text-center text-gray-400"
                      >
                        No rows loaded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => setStep(2)}
              className="text-xs px-4 py-2 border rounded-lg"
            >
              ← Back to mapping
            </button>
            <button
              onClick={handleCommit}
              disabled={committing || !rows.length}
              className="text-xs px-4 py-2 rounded-lg bg-blue-600 text-white flex items-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3" />
              {committing ? "Importing..." : "Import matched rows"}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4 – DONE + PDF */}
      {step === 4 && summary && (
        <div className="border rounded-xl p-6 bg-white space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h2 className="font-semibold text-sm">
              Migration completed successfully
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <StatCard label="Total rows in file" value={summary.total} />
            <StatCard label="Imported (matched)" value={summary.imported} />
            <StatCard label="Duplicates detected" value={summary.duplicates} />
            <StatCard label="Skipped / not imported" value={summary.skipped} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={downloadPdf}
              className="text-xs px-4 py-2 rounded-lg border bg-gray-50 flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              Download summary PDF
            </button>
            <button
              onClick={() => {
                setStep(1);
                setFile(null);
                setJobId(null);
                setRows([]);
                setSummary(null);
                setFileColumns([]);
              }}
              className="text-xs px-4 py-2 rounded-lg border"
            >
              Start new migration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}
