"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

type Line = {
  debit: number | null;
  credit: number | null;
};

type JournalRow = {
  id: string;
  entry_date: string | null;
  description: string | null;
  reference: string | null;
  source_module: string | null;
  acc_journal_entry_lines: Line[] | null;
};

const PAGE_SIZE = 20;

function toAmount(value: number | string | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function money(value: number | string | null | undefined): string {
  return toAmount(value).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function totalsFromLines(lines: Line[] | null | undefined): { debit: number; credit: number } {
  return (lines ?? []).reduce<{ debit: number; credit: number }>(
    (acc, line) => {
      acc.debit += toAmount(line.debit);
      acc.credit += toAmount(line.credit);
      return acc;
    },
    { debit: 0, credit: 0 }
  );
}

export default function JournalPage() {
  const [rows, setRows] = useState<JournalRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [source, setSource] = useState("");
  const [search, setSearch] = useState("");

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  async function fetchData() {
    if (!supabaseClient) return;

    setLoading(true);

    try {
      let query = supabaseClient
        .from("acc_journal_entries")
        .select(
          `
          id,
          entry_date,
          description,
          reference,
          source_module,
          acc_journal_entry_lines (
            debit,
            credit
          )
        `,
          { count: "exact" }
        )
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (dateFrom) query = query.gte("entry_date", dateFrom);
      if (dateTo) query = query.lte("entry_date", dateTo);
      if (source) query = query.eq("source_module", source);
      if (search.trim()) query = query.ilike("description", `%${search.trim()}%`);

      const { data, error, count } = await query;

      if (error) {
        console.error("Journal error:", error);
        setRows([]);
        setTotal(0);
        return;
      }

      setRows((data ?? []) as JournalRow[]);
      setTotal(count ?? 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [page, dateFrom, dateTo, source, search]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        const rowTotals = totalsFromLines(row.acc_journal_entry_lines);
        acc.debit += rowTotals.debit;
        acc.credit += rowTotals.credit;
        return acc;
      },
      { debit: 0, credit: 0 }
    );
  }, [rows]);

  function handleExport() {
    const header = ["Date", "Reference", "Description", "Debit", "Credit"].join(",");

    const lines = rows.map((row) => {
      const totals = totalsFromLines(row.acc_journal_entry_lines);

      return [
        row.entry_date ?? "",
        row.reference ?? "",
        `"${String(row.description ?? "").replace(/"/g, '""')}"`,
        totals.debit.toFixed(2),
        totals.credit.toFixed(2),
      ].join(",");
    });

    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "journal-entries.csv";
    anchor.click();

    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-amber-400">
                Arfeen Travel · Accounts
              </p>
              <h1 className="mt-3 text-3xl font-black">Journal Entries</h1>
              <p className="mt-2 text-sm text-slate-400">
                Live data from <code>acc_journal_entries</code> with debit/credit line totals.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExport}
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
              >
                Export CSV
              </button>

              <a
                href="/accounts/journal/new"
                className="rounded-2xl bg-amber-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-amber-300"
              >
                + New Journal Entry
              </a>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-4">
              <p className="text-xs uppercase text-slate-500">Page Debit</p>
              <p className="mt-2 text-2xl font-black text-emerald-300">
                PKR {money(summary.debit)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-4">
              <p className="text-xs uppercase text-slate-500">Page Credit</p>
              <p className="mt-2 text-2xl font-black text-amber-300">
                PKR {money(summary.credit)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900 p-4">
              <p className="text-xs uppercase text-slate-500">Total Records</p>
              <p className="mt-2 text-2xl font-black">{total}</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="grid gap-3 md:grid-cols-5">
            <input
              type="date"
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none"
              value={dateFrom}
              onChange={(event) => {
                setPage(0);
                setDateFrom(event.target.value);
              }}
            />

            <input
              type="date"
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none"
              value={dateTo}
              onChange={(event) => {
                setPage(0);
                setDateTo(event.target.value);
              }}
            />

            <select
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none"
              value={source}
              onChange={(event) => {
                setPage(0);
                setSource(event.target.value);
              }}
            >
              <option value="">All Sources</option>
              <option value="transport">Transport</option>
              <option value="umrah">Umrah Packages</option>
              <option value="flight">Flights</option>
              <option value="manual">Manual</option>
            </select>

            <input
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm outline-none md:col-span-2"
              placeholder="Search description..."
              value={search}
              onChange={(event) => {
                setPage(0);
                setSearch(event.target.value);
              }}
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/[0.06] text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Reference</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-right">Debit</th>
                  <th className="px-4 py-3 text-right">Credit</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => {
                  const totals = totalsFromLines(row.acc_journal_entry_lines);

                  return (
                    <tr key={row.id} className="border-t border-white/10 hover:bg-white/[0.03]">
                      <td className="px-4 py-3 text-slate-300">
                        {row.entry_date ? new Date(row.entry_date).toISOString().slice(0, 10) : "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{row.reference ?? "-"}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{row.description ?? "-"}</div>
                        <div className="text-xs text-slate-500">{row.source_module ?? "manual"}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-300">
                        {money(totals.debit)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-amber-300">
                        {money(totals.credit)}
                      </td>
                    </tr>
                  );
                })}

                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                      No journal entries found.
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                      Loading journal entries...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="flex items-center justify-between gap-4 text-xs text-slate-400">
          <span>
            Page {page + 1} of {pageCount} · {total} records
          </span>

          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              className="rounded-xl border border-white/10 px-3 py-2 disabled:opacity-40"
            >
              Prev
            </button>

            <button
              disabled={page + 1 >= pageCount}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-xl border border-white/10 px-3 py-2 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}