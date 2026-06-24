"use client";

import { Download, Printer } from "lucide-react";
import { useEffect, useState } from "react";

export default function KhurakiReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    city: "all",
    status: "all",
  });

  async function load() {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (filters.from) params.set("from", filters.from);
    if (filters.to) params.set("to", filters.to);
    if (filters.city !== "all") params.set("city", filters.city);
    if (filters.status !== "all") params.set("status", filters.status);

    const json = await fetch(`/api/hotels/khuraki/reports?${params}`, {
      cache: "no-store",
    }).then((res) => res.json());

    if (json.ok) {
      setData(json);
    } else {
      setError(json.error || "Report load failed.");
    }

    setLoading(false);
  }

  function exportCsv() {
    if (!data) return;

    const rows = [
      ["Metric", "Value"],
      ["Total Contracts", data.summary.total_contracts],
      ["Active Contracts", data.summary.active_contracts],
      ["Total Pax", data.summary.total_pax],
      ["Voucher Stays", data.summary.voucher_stays_count],
      ["Checked In", data.summary.checked_in_count],
      ["Checked Out", data.summary.checked_out_count],
      ["Checkout Due", data.summary.checkout_due_count],
      ["Active Incidents", data.summary.active_incidents],
      ["Supplier Bills", data.summary.supplier_bills_count],
      ["High Risk Bills", data.summary.high_overbilling_risk_bills],
      ["AI Action Logs", data.summary.ai_logs_requiring_action],
      ["Daily Planned Pax", data.daily_run_totals.planned_pax],
      ["Daily Actual Pax", data.daily_run_totals.actual_pax],
      ["Meals Served", data.daily_run_totals.meals_served],
      ["Shortage Total", data.daily_run_totals.shortage_total],
      ["Waste Total", data.daily_run_totals.waste_total],
      ["Filter From", filters.from],
      ["Filter To", filters.to],
      ["Filter City", filters.city],
      ["Filter Status", filters.status],
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `khuraki-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    load();
  }, []);

  const summary = data?.summary || {};
  const daily = data?.daily_run_totals || {};
  const incidents = data?.incidents || {};
  const supplierBills = data?.supplier_bills || {};

  return (
    <div className="min-h-screen bg-white p-8 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <h1 className="text-3xl font-black">Khuraki Print Reports</h1>
            <p className="mt-1 text-sm text-slate-500">
              Live hotel khuraki operations, supplier risk and daily meal summary.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={exportCsv}
              disabled={!data}
              className="flex items-center gap-2 rounded-xl border px-5 py-3 font-bold text-slate-950 disabled:opacity-50"
            >
              <Download size={16} /> Export CSV
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white"
            >
              <Printer size={16} /> Print Report
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 print:hidden">
            {error}
          </div>
        ) : null}

        <div className="mb-6 grid gap-3 rounded-2xl border bg-slate-50 p-4 print:hidden md:grid-cols-5">
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            className="rounded-xl border px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            className="rounded-xl border px-3 py-2 text-sm"
          />
          <select
            value={filters.city}
            onChange={(e) => setFilters({ ...filters, city: e.target.value })}
            className="rounded-xl border px-3 py-2 text-sm"
          >
            <option value="all">All Cities</option>
            <option value="makkah">Makkah</option>
            <option value="madinah">Madinah</option>
            <option value="other">Other</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="rounded-xl border px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="issue">Issue</option>
            <option value="closed">Closed</option>
            <option value="completed">Completed</option>
          </select>
          <button
            onClick={load}
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white"
          >
            Apply Filters
          </button>
        </div>

        <div className="rounded-2xl border p-6">
          <h2 className="text-2xl font-black">Hotel Khuraki Operations Report</h2>
          <p className="mt-2 text-slate-600">
            Voucher stays, checkout calling, incidents, supplier billing aur AI risks ka summary report.
          </p>

          {loading ? (
            <div className="mt-8 rounded-xl border p-6 text-slate-500">
              Loading Khuraki report...
            </div>
          ) : (
            <>
              <div className="mt-8 grid gap-4 md:grid-cols-4">
                <Box title="Contracts" value={summary.total_contracts || 0} />
                <Box title="Active Contracts" value={summary.active_contracts || 0} />
                <Box title="Total Pax" value={summary.total_pax || 0} />
                <Box title="Voucher Stays" value={summary.voucher_stays_count || 0} />
                <Box title="Checked In" value={summary.checked_in_count || 0} />
                <Box title="Checked Out" value={summary.checked_out_count || 0} />
                <Box title="Checkout Due" value={summary.checkout_due_count || 0} danger />
                <Box title="AI Action Logs" value={summary.ai_logs_requiring_action || 0} danger />
              </div>

              <Section title="Daily Run Summary">
                <div className="grid gap-4 md:grid-cols-5">
                  <Box title="Planned Pax" value={daily.planned_pax || 0} />
                  <Box title="Actual Pax" value={daily.actual_pax || 0} />
                  <Box title="Meals Served" value={daily.meals_served || 0} />
                  <Box title="Shortage" value={daily.shortage_total || 0} danger />
                  <Box title="Waste" value={daily.waste_total || 0} danger />
                </div>
              </Section>

              <Section title="Incident Summary">
                <div className="grid gap-4 md:grid-cols-4">
                  <Box title="Total Incidents" value={incidents.total || 0} />
                  <Box title="Active Incidents" value={incidents.active || 0} danger />
                  <Box title="Critical" value={incidents.critical || 0} danger />
                  <Box title="High" value={incidents.high || 0} danger />
                </div>
              </Section>

              <Section title="Supplier Bill Risk">
                <div className="grid gap-4 md:grid-cols-3">
                  <Box title="Supplier Bills" value={supplierBills.total || 0} />
                  <Box title="Pending Bills" value={supplierBills.pending || 0} />
                  <Box title="High Risk Bills" value={supplierBills.high_risk || 0} danger />
                </div>
              </Section>
            </>
          )}

          <div className="mt-8">
            <h3 className="text-xl font-bold">Manager Notes</h3>
            <div className="mt-3 h-48 rounded-xl border p-4 text-slate-500">
              Notes / Signature / Verification
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <section className="mt-8">
      <h3 className="mb-3 text-xl font-bold">{title}</h3>
      {children}
    </section>
  );
}

function Box({ title, value, danger = false }: any) {
  return (
    <div className={danger ? "rounded-xl border border-red-200 bg-red-50 p-4" : "rounded-xl border p-4"}>
      <div className="text-sm text-slate-500">{title}</div>
      <div className={danger ? "text-2xl font-black text-red-700" : "text-2xl font-black"}>{value}</div>
    </div>
  );
}