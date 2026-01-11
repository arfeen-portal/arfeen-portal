"use client";

import { useEffect, useState } from "react";
import { supabase } from '@/lib/supabaseClient';


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
  acc_journal_entry_lines: Line[];
};

const PAGE_SIZE = 20;

export default function JournalPage() {
 ; // ✅ SAFE (may be null at build time)

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

  useEffect(() => {
    // 🔒 IMPORTANT: build / prerender safety
    if (!supabase) return;

    const fetchData = async () => {
      setLoading(true);

      let query = supabase
        .from("acc_journal_entries")
        .select(
          `
          id,
          entry_date,
          description,
          reference,
          source_module,
          acc_journal_entry_lines(debit, credit)
        `,
          { count: "exact" }
        )
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (dateFrom) query = query.gte("entry_date", dateFrom);
      if (dateTo) query = query.lte("entry_date", dateTo);
      if (source) query = query.eq("source_module", source);
      if (search.trim()) {
        query = query.ilike("description", `%${search.trim()}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error("Journal error:", error);
        setRows([]);
        setTotal(0);
      } else {
        setRows((data || []) as JournalRow[]);
        setTotal(count || 0);
      }

      setLoading(false);
    };

    fetchData();
  }, [supabase, page, dateFrom, dateTo, source, search]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleExport = () => {
    const header = ["Date", "Reference", "Description", "Debit", "Credit"].join(",");

    const lines = rows.map((r) => {
      const totals = r.acc_journal_entry_lines.reduce(
        (acc, l) => {
          acc.debit += Number(l.debit || 0);
          acc.credit += Number(l.credit || 0);
          return acc;
        },
        { debit: 0, credit: 0 }
      );

      return [
        r.entry_date || "",
        r.reference || "",
        r.description || "",
        totals.debit.toFixed(2),
        totals.credit.toFixed(2),
      ].join(",");
    });

    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "journal-entries.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Journal Entries</h1>
          <p className="text-xs text-gray-500">
            Live data from <code>acc_journal_entries</code> +{" "}
            <code>acc_journal_entry_lines</code>
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-2 text-xs rounded border"
          >
            Export CSV
          </button>
          <button className="px-4 py-2 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700">
            + New Journal Entry
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="date"
          className="border rounded px-3 py-2 text-sm"
          value={dateFrom}
          onChange={(e) => {
            setPage(0);
            setDateFrom(e.target.value);
          }}
        />

        <input
          type="date"
          className="border rounded px-3 py-2 text-sm"
          value={dateTo}
          onChange={(e) => {
            setPage(0);
            setDateTo(e.target.value);
          }}
        />

        <select
          className="border rounded px-3 py-2 text-sm"
          value={source}
          onChange={(e) => {
            setPage(0);
            setSource(e.target.value);
          }}
        >
          <option value="">All Sources</option>
          <option value="transport">Transport</option>
          <option value="umrah">Umrah Packages</option>
          <option value="flight">Flights</option>
          <option value="manual">Manual</option>
        </select>

        <input
          className="border rounded px-3 py-2 text-sm min-w-[180px]"
          placeholder="Search description..."
          value={search}
          onChange={(e) => {
            setPage(0);
            setSearch(e.target.value);
          }}
        />
      </div>

      {/* Table */}
      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Date</th>
              <th className="px-3 py-2 text-left font-semibold">Reference</th>
              <th className="px-3 py-2 text-left font-semibold">Description</th>
              <th className="px-3 py-2 text-right font-semibold">Debit</th>
              <th className="px-3 py-2 text-right font-semibold">Credit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const totals = r.acc_journal_entry_lines.reduce(
                (acc, l) => {
                  acc.debit += Number(l.debit || 0);
                  acc.credit += Number(l.credit || 0);
                  return acc;
                },
                { debit: 0, credit: 0 }
              );

              return (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">
                    {r.entry_date
                      ? new Date(r.entry_date).toISOString().slice(0, 10)
                      : ""}
                  </td>
                  <td className="px-3 py-2">{r.reference}</td>
                  <td className="px-3 py-2">{r.description}</td>
                  <td className="px-3 py-2 text-right">
                    {totals.debit.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {totals.credit.toFixed(2)}
                  </td>
                </tr>
              );
            })}

            {!loading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-6 text-center text-gray-400"
                >
                  No journal entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>
          Page {page + 1} of {pageCount} ({total} records)
        </span>

        <div className="flex gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-2 py-1 border rounded disabled:opacity-40"
          >
            Prev
          </button>
          <button
            disabled={from + PAGE_SIZE >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-2 py-1 border rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
