"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Voucher = {
  id: string;
  voucher_no: string | null;
  voucher_type: string;
  voucher_date: string;
  amount: number;
  currency_code: string;
  party_type: string | null;
  party_id: string | null;
};

export default function VouchersPage() {
  const supabase = createClient();

  const [rows, setRows] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [postingId, setPostingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("acc_vouchers")
      .select(
        "id,voucher_no,voucher_type,voucher_date,amount,currency_code,party_type,party_id"
      )
      .order("voucher_date", { ascending: false });

    if (error) {
      console.error(error);
      setRows([]);
    } else {
      setRows((data || []) as Voucher[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const postVoucher = async (v: Voucher) => {
    // TODO: yahan tum apne chart-of-accounts se right account ids set karoge
    const debitAccountId = prompt(
      "Debit account UUID for this voucher?"
    );
    const creditAccountId = prompt(
      "Credit account UUID for this voucher?"
    );
    if (!debitAccountId || !creditAccountId) return;

    setPostingId(v.id);

    const { data, error } = await supabase.rpc(
      "acc_post_simple_voucher",
      {
        p_voucher_id: v.id,
        p_debit_account: debitAccountId,
        p_credit_account: creditAccountId,
      }
    );

    if (error) {
      console.error(error);
      alert("Error posting voucher: " + error.message);
    } else {
      alert("Voucher posted to journal, id: " + data);
    }

    setPostingId(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Vouchers</h1>
          <p className="text-sm text-gray-500">
            From table <code>acc_vouchers</code>. Posting uses{" "}
            <code>acc_post_simple_voucher</code>.
          </p>
        </div>
        <button
          onClick={load}
          className="px-3 py-2 text-xs sm:text-sm rounded border"
        >
          Refresh
        </button>
      </div>

      {loading && (
        <p className="text-xs text-gray-400">Loading vouchers…</p>
      )}

      <div className="overflow-auto border rounded-lg">
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Date</th>
              <th className="px-3 py-2 text-left font-semibold">No</th>
              <th className="px-3 py-2 text-left font-semibold">Type</th>
              <th className="px-3 py-2 text-right font-semibold">Amount</th>
              <th className="px-3 py-2 text-left font-semibold">Party</th>
              <th className="px-3 py-2 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id} className="border-t">
                <td className="px-3 py-2">
                  {new Date(v.voucher_date).toISOString().slice(0, 10)}
                </td>
                <td className="px-3 py-2">{v.voucher_no}</td>
                <td className="px-3 py-2 capitalize">
                  {v.voucher_type}
                </td>
                <td className="px-3 py-2 text-right">
                  {v.amount.toFixed(2)} {v.currency_code}
                </td>
                <td className="px-3 py-2">
                  {v.party_type ? `${v.party_type} – ${v.party_id}` : "-"}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    disabled={postingId === v.id}
                    onClick={() => postVoucher(v)}
                    className="px-3 py-1 text-xs rounded bg-blue-600 text-white disabled:opacity-50"
                  >
                    {postingId === v.id ? "Posting…" : "Post to Journal"}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-xs text-gray-400"
                >
                  No vouchers.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
