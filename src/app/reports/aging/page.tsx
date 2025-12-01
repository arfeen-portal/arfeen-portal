"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Row = {
  party_type: string;
  party_id: string;
  first_tran_date: string | null;
  total_balance_base: number | null;
  bucket_0_7: number | null;
  bucket_8_15: number | null;
  bucket_16_30: number | null;
  bucket_31_60: number | null;
  bucket_60_plus: number | null;
};

export default function AgingReportPage() {
  const supabase = createClient();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [partyType, setPartyType] = useState<"agent" | "supplier" | "customer">(
    "agent"
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      let { data, error } = await supabase
        .from("acc_aging_by_party_view")
        .select("*")
        .eq("party_type", partyType);

      if (error) {
        console.error("Aging error", error);
        data = [];
      }

      setRows((data || []) as Row[]);
      setLoading(false);
    };

    fetchData();
  }, [supabase, partyType]);

  const handleExport = () => {
    const header = [
      "Party Type",
      "Party Id",
      "First Tran Date",
      "Total",
      "0-7",
      "8-15",
      "16-30",
      "31-60",
      ">60",
    ].join(",");

    const lines = rows.map((r) =>
      [
        r.party_type,
        r.party_id,
        r.first_tran_date || "",
        Number(r.total_balance_base || 0).toFixed(2),
        Number(r.bucket_0_7 || 0).toFixed(2),
        Number(r.bucket_8_15 || 0).toFixed(2),
        Number(r.bucket_16_30 || 0).toFixed(2),
        Number(r.bucket_31_60 || 0).toFixed(2),
        Number(r.bucket_60_plus || 0).toFixed(2),
      ].join(",")
    );

    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aging-${partyType}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => window.print();

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Aging Report</h1>
          <p className="text-sm text-gray-500">
            Using <code>acc_aging_by_party_view</code>.
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

      <div className="flex flex-wrap gap-3">
        <select
          className="border rounded px-3 py-2 text-sm"
          value={partyType}
          onChange={(e) =>
            setPartyType(e.target.value as "agent" | "supplier" | "customer")
          }
        >
          <option value="agent">Agents</option>
          <option value="supplier">Suppliers</option>
          <option value="customer">Customers</option>
        </select>
        {loading && (
          <span className="text-xs text-gray-400 self-center">Loading…</span>
        )}
      </div>

      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Party ID</th>
              <th className="px-3 py-2 text-left font-semibold">
                First Tran Date
              </th>
              <th className="px-3 py-2 text-right font-semibold">Total</th>
              <th className="px-3 py-2 text-right font-semibold">0–7</th>
              <th className="px-3 py-2 text-right font-semibold">8–15</th>
              <th className="px-3 py-2 text-right font-semibold">16–30</th>
              <th className="px-3 py-2 text-right font-semibold">31–60</th>
              <th className="px-3 py-2 text-right font-semibold">&gt; 60</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.party_id} className="border-t">
                <td className="px-3 py-2">{r.party_id}</td>
                <td className="px-3 py-2">
                  {r.first_tran_date
                    ? new Date(r.first_tran_date).toISOString().slice(0, 10)
                    : "-"}
                </td>
                <td className="px-3 py-2 text-right">
                  {Number(r.total_balance_base || 0).toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right">
                  {Number(r.bucket_0_7 || 0).toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right">
                  {Number(r.bucket_8_15 || 0).toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right">
                  {Number(r.bucket_16_30 || 0).toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right">
                  {Number(r.bucket_31_60 || 0).toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right">
                  {Number(r.bucket_60_plus || 0).toFixed(2)}
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-6 text-center text-xs text-gray-400"
                >
                  No data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
