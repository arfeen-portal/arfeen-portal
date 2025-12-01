"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Row = {
  id: string;
  entry_date: string;
  reference: string | null;
  description: string | null;
  debit: number;
  credit: number;
  balance: number;
};

export default function PartyLedgerPage() {
  const supabase = createClient();

  const [partyType, setPartyType] = useState<"agent" | "supplier" | "customer">(
    "agent"
  );
  const [partyId, setPartyId] = useState("");
  const [partyName, setPartyName] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const loadPartyName = async (type: string, id: string) => {
    if (!id) {
      setPartyName("");
      return;
    }

    // 👇 yahan apne actual table names laga sakte ho agar different hon
    const table =
      type === "agent"
        ? "agents"
        : type === "supplier"
        ? "suppliers"
        : "customers";

    const { data, error } = await supabase
      .from(table)
      .select("id,name")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      setPartyName(id);
    } else {
      setPartyName(data.name || id);
    }
  };

  const fetchLedger = async () => {
    if (!partyId) return;
    setLoading(true);

    await loadPartyName(partyType, partyId);

    const { data, error } = await supabase
      .from("acc_journal_entry_lines")
      .select(
        "id, debit, credit, journal_entry:acc_journal_entries(entry_date,reference,description)"
      )
      .eq("party_type", partyType)
      .eq("party_id", partyId)
      .order("journal_entry.entry_date", { ascending: true });

    if (error) {
      console.error(error);
      setRows([]);
      setBalance(0);
      setLoading(false);
      return;
    }

    let list = (data || []) as any[];

    if (dateFrom) {
      list = list.filter(
        (r) => r.journal_entry.entry_date >= dateFrom
      );
    }
    if (dateTo) {
      list = list.filter(
        (r) => r.journal_entry.entry_date <= dateTo
      );
    }

    let running = 0;
    const normalized: Row[] = list.map((r: any) => {
      const debit = Number(r.debit || 0);
      const credit = Number(r.credit || 0);
      running += debit - credit;
      return {
        id: r.id,
        entry_date: r.journal_entry.entry_date,
        reference: r.journal_entry.reference,
        description: r.journal_entry.description,
        debit,
        credit,
        balance: running,
      };
    });

    setRows(normalized);
    setBalance(running);
    setLoading(false);
  };

  const handleExport = () => {
    if (!rows.length) return;
    const header = [
      "Date",
      "Reference",
      "Description",
      "Debit",
      "Credit",
      "Balance",
    ].join(",");

    const lines = rows.map((r) =>
      [
        r.entry_date,
        r.reference || "",
        `"${r.description || ""}"`,
        r.debit.toFixed(2),
        r.credit.toFixed(2),
        r.balance.toFixed(2),
      ].join(",")
    );

    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledger-${partyType}-${partyId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Party Ledger</h1>
          {partyName && (
            <p className="text-sm text-gray-600">
              {partyType.toUpperCase()} – {partyName}
            </p>
          )}
          <p className="text-xs text-gray-500">
            Data from <code>acc_journal_entry_lines</code>.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-3 py-2 text-xs sm:text-sm rounded border"
          >
            Print
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-2 text-xs sm:text-sm rounded border"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold mb-1">
            Party Type
          </label>
          <select
            className="border rounded px-3 py-2 text-sm"
            value={partyType}
            onChange={(e) =>
              setPartyType(
                e.target.value as "agent" | "supplier" | "customer"
              )
            }
          >
            <option value="agent">Agent</option>
            <option value="supplier">Supplier</option>
            <option value="customer">Customer</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">
            Party ID (UUID)
          </label>
          <input
            className="border rounded px-3 py-2 text-sm min-w-[220px]"
            placeholder="Paste agent / supplier / customer id"
            value={partyId}
            onChange={(e) => setPartyId(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">
            From
          </label>
          <input
            type="date"
            className="border rounded px-3 py-2 text-sm"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">
            To
          </label>
          <input
            type="date"
            className="border rounded px-3 py-2 text-sm"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={fetchLedger}
          className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Load Ledger
        </button>
        {loading && (
          <span className="text-xs text-gray-400">Loading…</span>
        )}
      </div>

      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Date</th>
              <th className="px-3 py-2 text-left font-semibold">Reference</th>
              <th className="px-3 py-2 text-left font-semibold">Description</th>
              <th className="px-3 py-2 text-right font-semibold">Debit</th>
              <th className="px-3 py-2 text-right font-semibold">Credit</th>
              <th className="px-3 py-2 text-right font-semibold">Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">
                  {new Date(r.entry_date).toISOString().slice(0, 10)}
                </td>
                <td className="px-3 py-2">{r.reference}</td>
                <td className="px-3 py-2">{r.description}</td>
                <td className="px-3 py-2 text-right">
                  {r.debit.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right">
                  {r.credit.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right">
                  {r.balance.toFixed(2)}
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && partyId && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-xs text-gray-400"
                >
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-3 py-2 font-semibold" colSpan={5}>
                Closing Balance
              </td>
              <td className="px-3 py-2 text-right font-semibold text-blue-700">
                {balance.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
