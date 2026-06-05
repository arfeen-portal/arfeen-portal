"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type VoucherLine = {
  account_name: string;
  description: string;
  debit: string;
  credit: string;
};

export default function NewVoucherPage() {
  const router = useRouter();

  const [voucherType, setVoucherType] = useState("journal");
  const [voucherDate, setVoucherDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState("");
  const [partyName, setPartyName] = useState("");
  const [currency, setCurrency] = useState("PKR");
  const [loading, setLoading] = useState(false);

  const [lines, setLines] = useState<VoucherLine[]>([
    {
      account_name: "Cash",
      description: "",
      debit: "0",
      credit: "0",
    },
    {
      account_name: "Sales",
      description: "",
      debit: "0",
      credit: "0",
    },
  ]);

  const totalDebit = useMemo(() => {
    return lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  }, [lines]);

  const totalCredit = useMemo(() => {
    return lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
  }, [lines]);

  const isBalanced =
    totalDebit > 0 &&
    totalCredit > 0 &&
    Number(totalDebit.toFixed(2)) === Number(totalCredit.toFixed(2));

  function updateLine(index: number, key: keyof VoucherLine, value: string) {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [key]: value } : line))
    );
  }

  function addLine() {
    setLines((prev) => [
      ...prev,
      {
        account_name: "",
        description: "",
        debit: "0",
        credit: "0",
      },
    ]);
  }

  function removeLine(index: number) {
    if (lines.length <= 2) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  async function submitVoucher() {
    if (!isBalanced) {
      alert("Voucher balanced nahi hai. Debit aur Credit equal hone chahiye.");
      return;
    }

    const cleanLines = lines
      .filter((line) => line.account_name.trim())
      .map((line) => ({
        account_name: line.account_name.trim(),
        description: line.description || description,
        debit: Number(line.debit || 0),
        credit: Number(line.credit || 0),
        party_name: partyName,
      }));

    setLoading(true);

    try {
      const res = await fetch("/api/accounting/vouchers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          voucher_type: voucherType,
          voucher_date: voucherDate,
          description,
          party_name: partyName,
          currency,
          exchange_rate: 1,
          lines: cleanLines,
        }),
      });

      const text = await res.text();
let json: any = {};

try {
  json = text ? JSON.parse(text) : {};
} catch {
  alert(`API returned invalid response. Status: ${res.status}`);
  return;
}

      if (!res.ok) {
        alert(json.error || "Voucher post nahi hua.");
        return;
      }

      alert("Voucher successfully posted.");
      router.push("/accounts/vouchers");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col justify-between gap-4 rounded-2xl border bg-white p-5 shadow-sm md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              New Finance Voucher
            </h1>
            <p className="text-sm text-slate-500">
              Proper double-entry voucher posting for ledger, trial balance and reports.
            </p>
          </div>

          <button
            onClick={() => router.push("/accounts/vouchers")}
            className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Vouchers
          </button>
        </div>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <label className="text-xs font-bold uppercase text-slate-500">
                Voucher Type
              </label>
              <select
                value={voucherType}
                onChange={(e) => setVoucherType(e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-emerald-500"
              >
                <option value="journal">Journal Voucher</option>
                <option value="cash">Cash Voucher</option>
                <option value="bank">Bank Voucher</option>
                <option value="receipt">Receipt Voucher</option>
                <option value="payment">Payment Voucher</option>
                <option value="expense">Expense Voucher</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-500">
                Voucher Date
              </label>
              <input
                type="date"
                value={voucherDate}
                onChange={(e) => setVoucherDate(e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-500">
                Party / Agent
              </label>
              <input
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                placeholder="Optional"
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-500">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-emerald-500"
              >
                <option value="PKR">PKR</option>
                <option value="SAR">SAR</option>
                <option value="USD">USD</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-500">
                Narration
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Voucher description"
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Voucher Lines
              </h2>
              <p className="text-sm text-slate-500">
                Debit aur credit equal hone chahiye.
              </p>
            </div>

            <button
              onClick={addLine}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
            >
              + Add Line
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-3">Account Name</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-right">Debit</th>
                  <th className="p-3 text-right">Credit</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {lines.map((line, index) => (
                  <tr key={index} className="border-t bg-white">
                    <td className="p-3">
                      <input
                        value={line.account_name}
                        onChange={(e) =>
                          updateLine(index, "account_name", e.target.value)
                        }
                        placeholder="Cash / Sales / Expense"
                        className="w-full rounded-lg border px-3 py-2 outline-none focus:border-emerald-500"
                      />
                    </td>

                    <td className="p-3">
                      <input
                        value={line.description}
                        onChange={(e) =>
                          updateLine(index, "description", e.target.value)
                        }
                        placeholder="Line narration"
                        className="w-full rounded-lg border px-3 py-2 outline-none focus:border-emerald-500"
                      />
                    </td>

                    <td className="p-3">
                      <input
                        type="number"
                        value={line.debit}
                        onChange={(e) =>
                          updateLine(index, "debit", e.target.value)
                        }
                        className="w-full rounded-lg border px-3 py-2 text-right outline-none focus:border-emerald-500"
                      />
                    </td>

                    <td className="p-3">
                      <input
                        type="number"
                        value={line.credit}
                        onChange={(e) =>
                          updateLine(index, "credit", e.target.value)
                        }
                        className="w-full rounded-lg border px-3 py-2 text-right outline-none focus:border-emerald-500"
                      />
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => removeLine(index)}
                        disabled={lines.length <= 2}
                        className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot className="bg-slate-50 font-bold">
                <tr>
                  <td className="p-3" colSpan={2}>
                    Total
                  </td>
                  <td className="p-3 text-right">
                    {totalDebit.toLocaleString()}
                  </td>
                  <td className="p-3 text-right">
                    {totalCredit.toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    {isBalanced ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                        Balanced
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-700">
                        Unbalanced
                      </span>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={submitVoucher}
              disabled={!isBalanced || loading}
              className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Posting..." : "Post Voucher"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}