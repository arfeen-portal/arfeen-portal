"use client";

import React, { useEffect, useMemo, useState } from "react";

interface ImportJob {
  id: string;
  type: string;
  filename: string | null;
  total_rows: number;
  success_rows: number;
  failed_rows: number;
  status: string;
  created_at: string;
  agent_label?: string | null;
  primary_supplier_name?: string | null;
}

interface ImportErrorRow {
  id: string;
  job_id: string;
  row_number: number;
  error_message: string;
  raw_data: Record<string, any> | null;
  created_at: string;
}

interface JobDetailResponse {
  job: ImportJob;
  errors: ImportErrorRow[];
}

interface ImpactSampleRow {
  label: string;
  old_price: number | null;
  new_price: number;
  diff: number | null;
  direction: "cheaper" | "expensive" | "same" | "new";
}

interface ImpactSummary {
  job_id: string;
  type: string;
  total_new_rows: number;
  comparable_rows: number;
  cheaper_count: number;
  more_expensive_count: number;
  unchanged_count: number;
  no_previous_count: number;
  total_old_value: number;
  total_new_value: number;
  net_change: number;
  avg_change_per_row: number | null;
  samples: ImpactSampleRow[];
}

export default function ImportJobsPage() {
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState<boolean>(false);
  const [selectedJob, setSelectedJob] = useState<ImportJob | null>(null);
  const [errors, setErrors] = useState<ImportErrorRow[]>([]);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 🔍 Filters
  const [filterType, setFilterType] = useState<"all" | "hotel" | "flight">(
    "all"
  );
  const [filterStatus, setFilterStatus] = useState<
    "all" | "completed" | "failed" | "processing"
  >("all");
  const [filterFrom, setFilterFrom] = useState<string>("");
  const [filterTo, setFilterTo] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [filterAgent, setFilterAgent] = useState<string>("");
  const [filterSupplier, setFilterSupplier] = useState<string>("");

  // Impact
  const [impact, setImpact] = useState<ImpactSummary | null>(null);
  const [loadingImpact, setLoadingImpact] = useState<boolean>(false);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoadingJobs(true);
      setErrorMsg(null);
      try {
        const res = await fetch("/api/rate-import");
        const json = await res.json();
        if (!res.ok) {
          setErrorMsg(json?.error || "Failed to load jobs");
        } else {
          setJobs(json.jobs || []);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Unexpected error while loading jobs.");
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchJobs();
  }, []);

  const loadJobDetail = async (job: ImportJob) => {
    setSelectedJob(job);
    setErrors([]);
    setImpact(null);
    setLoadingDetail(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/rate-import?job_id=${job.id}`);
      const json: JobDetailResponse & { error?: string } = await res.json();
      if (!res.ok) {
        setErrorMsg(json?.error || "Failed to load job details");
      } else {
        setSelectedJob(json.job);
        setErrors(json.errors || []);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Unexpected error while loading job details.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const loadImpact = async () => {
    if (!selectedJob) return;
    setLoadingImpact(true);
    setImpact(null);
    setErrorMsg(null);

    try {
      const res = await fetch(
        `/api/rate-import/impact?job_id=${selectedJob.id}`
      );
      const json: ImpactSummary & { error?: string } = await res.json();
      if (!res.ok) {
        setErrorMsg(json?.error || "Failed to calculate impact");
      } else {
        setImpact(json);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Unexpected error while calculating impact.");
    } finally {
      setLoadingImpact(false);
    }
  };

  // 🔽 CSV download helper
  const downloadCsv = (
    filename: string,
    headers: string[],
    rows: (string | number | null | undefined)[][]
  ) => {
    const escapeCell = (val: string | number | null | undefined) => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      if (str.includes('"') || str.includes(",") || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvLines = [
      headers.map(escapeCell).join(","),
      ...rows.map((r) => r.map(escapeCell).join(",")),
    ];

    const blob = new Blob([csvLines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSummaryCsv = () => {
    if (!selectedJob) return;
    const j = selectedJob;
    downloadCsv(
      `import-summary-${j.id}.csv`,
      [
        "Job ID",
        "Type",
        "Filename",
        "Agent",
        "Supplier",
        "Total Rows",
        "Success Rows",
        "Failed Rows",
        "Status",
        "Created At",
      ],
      [
        [
          j.id,
          j.type,
          j.filename || "",
          j.agent_label || "",
          j.primary_supplier_name || "",
          j.total_rows,
          j.success_rows,
          j.failed_rows,
          j.status,
          j.created_at,
        ],
      ]
    );
  };

  const handleDownloadErrorsCsv = () => {
    if (!selectedJob) return;
    if (!errors.length) {
      alert("No error rows for this job.");
      return;
    }

    const headers = ["Row Number", "Error Message", "Raw Data (JSON)"];
    const rowsData = errors.map((e) => [
      e.row_number,
      e.error_message,
      e.raw_data ? JSON.stringify(e.raw_data) : "",
    ]);

    downloadCsv(
      `import-errors-${selectedJob.id}.csv`,
      headers,
      rowsData
    );
  };

  const handlePrintSummary = () => {
    if (!selectedJob) return;

    const j = selectedJob;
    const errorRows = errors || [];
    const impactData = impact;

    const win = window.open("", "_blank");
    if (!win) return;

    const impactHtml = impactData
      ? `
      <h2>Live Impact</h2>
      <table class="meta-table">
        <tr><th>Total New Rows</th><td>${impactData.total_new_rows}</td></tr>
        <tr><th>Comparable Rows</th><td>${impactData.comparable_rows}</td></tr>
        <tr><th>Cheaper</th><td>${impactData.cheaper_count}</td></tr>
        <tr><th>More Expensive</th><td>${impactData.more_expensive_count}</td></tr>
        <tr><th>Unchanged</th><td>${impactData.unchanged_count}</td></tr>
        <tr><th>No Previous</th><td>${impactData.no_previous_count}</td></tr>
        <tr><th>Total Old Value</th><td>${impactData.total_old_value.toFixed(
          2
        )}</td></tr>
        <tr><th>Total New Value</th><td>${impactData.total_new_value.toFixed(
          2
        )}</td></tr>
        <tr><th>Net Change</th><td>${impactData.net_change.toFixed(2)}</td></tr>
      </table>
    `
      : "";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charSet="utf-8" />
          <title>Import Summary - ${j.id}</title>
          <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; padding: 24px; }
            h1 { font-size: 20px; margin-bottom: 12px; }
            h2 { font-size: 16px; margin-top: 24px; margin-bottom: 8px; }
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; vertical-align: top; }
            th { background: #f3f4f6; }
            .meta-table { width: auto; margin-bottom: 16px; }
          </style>
        </head>
        <body>
          <h1>Rate Import Summary</h1>
          <table class="meta-table">
            <tr><th>Job ID</th><td>${j.id}</td></tr>
            <tr><th>Type</th><td>${j.type}</td></tr>
            <tr><th>Filename</th><td>${j.filename || ""}</td></tr>
            <tr><th>Agent</th><td>${j.agent_label || ""}</td></tr>
            <tr><th>Supplier</th><td>${j.primary_supplier_name || ""}</td></tr>
            <tr><th>Total Rows</th><td>${j.total_rows}</td></tr>
            <tr><th>Success Rows</th><td>${j.success_rows}</td></tr>
            <tr><th>Failed Rows</th><td>${j.failed_rows}</td></tr>
            <tr><th>Status</th><td>${j.status}</td></tr>
            <tr><th>Created At</th><td>${j.created_at}</td></tr>
          </table>

          ${impactHtml}

          <h2>Error Rows (${errorRows.length})</h2>
          ${
            errorRows.length === 0
              ? "<p>No errors for this job.</p>"
              : `
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Row Number</th>
                  <th>Error Message</th>
                  <th>Raw Data (JSON)</th>
                </tr>
              </thead>
              <tbody>
                ${errorRows
                  .map(
                    (e, idx) => `
                    <tr>
                      <td>${idx + 1}</td>
                      <td>${e.row_number}</td>
                      <td>${e.error_message}</td>
                      <td>${e.raw_data ? String(JSON.stringify(e.raw_data)) : ""}</td>
                    </tr>
                  `
                  )
                  .join("")}
              </tbody>
            </table>
          `
          }
        </body>
      </html>
    `;

    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  // 🔍 FILTERED JOBS
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (filterType !== "all" && job.type !== filterType) return false;
      if (filterStatus !== "all" && job.status !== filterStatus) return false;

      if (filterFrom) {
        const from = new Date(filterFrom).getTime();
        const created = new Date(job.created_at).getTime();
        if (created < from) return false;
      }

      if (filterTo) {
        const to = new Date(filterTo).getTime();
        const created = new Date(job.created_at).getTime();
        if (created > to) return false;
      }

      if (filterAgent.trim()) {
        const q = filterAgent.trim().toLowerCase();
        const val = (job.agent_label || "").toLowerCase();
        if (!val.includes(q)) return false;
      }

      if (filterSupplier.trim()) {
        const q = filterSupplier.trim().toLowerCase();
        const val = (job.primary_supplier_name || "").toLowerCase();
        if (!val.includes(q)) return false;
      }

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const combined =
          (job.filename || "").toLowerCase() +
          " " +
          job.id.toLowerCase() +
          " " +
          (job.agent_label || "").toLowerCase() +
          " " +
          (job.primary_supplier_name || "").toLowerCase();
        if (!combined.includes(q)) return false;
      }

      return true;
    });
  }, [
    jobs,
    filterType,
    filterStatus,
    filterFrom,
    filterTo,
    search,
    filterAgent,
    filterSupplier,
  ]);

  const handleResetFilters = () => {
    setFilterType("all");
    setFilterStatus("all");
    setFilterFrom("");
    setFilterTo("");
    setSearch("");
    setFilterAgent("");
    setFilterSupplier("");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            Rate Import Jobs
          </h1>
          <p className="text-sm text-gray-500">
            Excel/CSV imports → agent/supplier filters, errors, exports &
            live impact.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="border rounded px-2 py-1 text-xs"
          >
            <option value="all">All Types</option>
            <option value="hotel">Hotel</option>
            <option value="flight">Flight</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="border rounded px-2 py-1 text-xs"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>

          <input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            className="border rounded px-2 py-1 text-xs"
            title="From date"
          />
          <input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            className="border rounded px-2 py-1 text-xs"
            title="To date"
          />

          <input
            placeholder="Agent"
            value={filterAgent}
            onChange={(e) => setFilterAgent(e.target.value)}
            className="border rounded px-2 py-1 text-xs"
          />

          <input
            placeholder="Supplier"
            value={filterSupplier}
            onChange={(e) => setFilterSupplier(e.target.value)}
            className="border rounded px-2 py-1 text-xs"
          />

          <input
            placeholder="Search file / id"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-2 py-1 text-xs"
          />

          <button
            onClick={handleResetFilters}
            className="text-xs px-3 py-1 rounded-full border bg-white hover:bg-gray-100"
          >
            Reset
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Jobs list */}
        <div className="bg-white shadow rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg text-primary">
              Import Jobs
            </h2>
            {loadingJobs && (
              <span className="text-xs text-gray-500">Loading...</span>
            )}
          </div>

          <div className="border rounded-lg max-h-[420px] overflow-auto text-sm">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 text-left">Created</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Agent</th>
                  <th className="px-3 py-2 text-left">Supplier</th>
                  <th className="px-3 py-2 text-left">Rows</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.length === 0 && !loadingJobs && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-4 text-center text-gray-400 text-xs"
                    >
                      No jobs match current filters.
                    </td>
                  </tr>
                )}

                {filteredJobs.map((job) => (
                  <tr
                    key={job.id}
                    className={`border-t hover:bg-gray-50 ${
                      selectedJob?.id === job.id ? "bg-gray-50" : ""
                    }`}
                  >
                    <td className="px-3 py-2 text-xs">
                      {new Date(job.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-xs capitalize">
                      {job.type}
                    </td>
                    <td className="px-3 py-2 text-xs truncate max-w-[80px]">
                      {job.agent_label || "-"}
                    </td>
                    <td className="px-3 py-2 text-xs truncate max-w-[80px]">
                      {job.primary_supplier_name || "-"}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {job.success_rows}/{job.total_rows}
                      {job.failed_rows > 0 && (
                        <span className="text-red-500 ml-1">
                          (+{job.failed_rows} ❌)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                          job.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : job.status === "processing"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        className="text-xs px-3 py-1 rounded-full border bg-white hover:bg-gray-100"
                        onClick={() => loadJobDetail(job)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Selected job + errors + export + impact */}
        <div className="bg-white shadow rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-lg text-primary">
              Job Detail & Errors
            </h2>
            {loadingDetail && (
              <span className="text-xs text-gray-500">Loading...</span>
            )}
          </div>

          {!selectedJob && (
            <div className="text-xs text-gray-400 flex-1 flex items-center justify-center text-center px-4">
              Select a job on the left to view its summary, error rows,
              export options, and live impact.
            </div>
          )}

          {selectedJob && (
            <>
              <div className="border rounded-lg p-3 mb-4 text-xs space-y-1 bg-gray-50">
                <div>
                  <span className="font-semibold">Job ID:</span>{" "}
                  {selectedJob.id}
                </div>
                <div>
                  <span className="font-semibold">Type:</span>{" "}
                  {selectedJob.type}
                </div>
                <div>
                  <span className="font-semibold">File:</span>{" "}
                  {selectedJob.filename || "-"}
                </div>
                <div>
                  <span className="font-semibold">Agent:</span>{" "}
                  {selectedJob.agent_label || "-"}
                </div>
                <div>
                  <span className="font-semibold">Supplier:</span>{" "}
                  {selectedJob.primary_supplier_name || "-"}
                </div>
                <div>
                  <span className="font-semibold">Rows:</span>{" "}
                  {selectedJob.success_rows}/{selectedJob.total_rows}{" "}
                  {selectedJob.failed_rows > 0 && (
                    <span className="text-red-500 ml-1">
                      (+{selectedJob.failed_rows} failed)
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-semibold">Status:</span>{" "}
                  {selectedJob.status}
                </div>
                <div>
                  <span className="font-semibold">Created:</span>{" "}
                  {new Date(selectedJob.created_at).toLocaleString()}
                </div>
              </div>

              {/* Export + impact buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  className="text-xs px-3 py-1 rounded-full bg-primary text-white"
                  onClick={handleDownloadSummaryCsv}
                >
                  ⬇️ Summary (CSV)
                </button>
                <button
                  className="text-xs px-3 py-1 rounded-full border border-primary text-primary bg-white"
                  onClick={handleDownloadErrorsCsv}
                >
                  ⬇️ Errors (CSV)
                </button>
                <button
                  className="text-xs px-3 py-1 rounded-full border bg-white hover:bg-gray-100"
                  onClick={handlePrintSummary}
                >
                  🖨 Print / PDF
                </button>
                <button
                  className="text-xs px-3 py-1 rounded-full border bg-white hover:bg-gray-100"
                  onClick={loadImpact}
                  disabled={loadingImpact}
                >
                  {loadingImpact ? "Calculating impact..." : "📊 Live Impact"}
                </button>
              </div>

              {/* Impact summary */}
              {impact && (
                <div className="border rounded-lg p-3 mb-4 text-xs bg-green-50 space-y-1">
                  <div className="font-semibold text-green-800">
                    Live Impact (Final Price = base + markup)
                  </div>
                  <div>
                    Total new rows: {impact.total_new_rows} | Comparable:{" "}
                    {impact.comparable_rows}
                  </div>
                  <div>
                    Cheaper: {impact.cheaper_count} | More expensive:{" "}
                    {impact.more_expensive_count} | Unchanged:{" "}
                    {impact.unchanged_count}
                  </div>
                  <div>No previous data: {impact.no_previous_count}</div>
                  <div>
                    Total old value: {impact.total_old_value.toFixed(2)} | Total
                    new value: {impact.total_new_value.toFixed(2)}
                  </div>
                  <div>
                    Net change:{" "}
                    <span
                      className={
                        impact.net_change < 0
                          ? "text-green-700"
                          : "text-red-700"
                      }
                    >
                      {impact.net_change.toFixed(2)}
                    </span>
                  </div>

                  {impact.samples.length > 0 && (
                    <div className="mt-2">
                      <div className="font-semibold mb-1">
                        Sample changes (top {impact.samples.length})
                      </div>
                      <div className="max-h-40 overflow-auto border rounded bg-white">
                        <table className="w-full text-[11px]">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 py-1 text-left">Item</th>
                              <th className="px-2 py-1 text-right">
                                Old
                              </th>
                              <th className="px-2 py-1 text-right">
                                New
                              </th>
                              <th className="px-2 py-1 text-right">
                                Diff
                              </th>
                              <th className="px-2 py-1 text-left">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {impact.samples.map((s, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="px-2 py-1">{s.label}</td>
                                <td className="px-2 py-1 text-right">
                                  {s.old_price !== null
                                    ? s.old_price.toFixed(2)
                                    : "-"}
                                </td>
                                <td className="px-2 py-1 text-right">
                                  {s.new_price.toFixed(2)}
                                </td>
                                <td className="px-2 py-1 text-right">
                                  {s.diff !== null
                                    ? s.diff.toFixed(2)
                                    : "-"}
                                </td>
                                <td className="px-2 py-1">
                                  {s.direction}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Errors table */}
              <div className="flex-1 border rounded-lg overflow-auto text-xs">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-2 text-left w-10">#</th>
                      <th className="px-2 py-2 text-left w-20">Row</th>
                      <th className="px-2 py-2 text-left">Error</th>
                      <th className="px-2 py-2 text-left">Raw Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errors.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-4 text-center text-gray-400"
                        >
                          No error rows for this job.
                        </td>
                      </tr>
                    )}

                    {errors.map((er, idx) => (
                      <tr key={er.id} className="border-t align-top">
                        <td className="px-2 py-2">{idx + 1}</td>
                        <td className="px-2 py-2">{er.row_number}</td>
                        <td className="px-2 py-2">{er.error_message}</td>
                        <td className="px-2 py-2 font-mono whitespace-pre-wrap">
                          {er.raw_data
                            ? JSON.stringify(er.raw_data, null, 2)
                            : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
