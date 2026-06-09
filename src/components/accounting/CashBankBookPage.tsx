"use client";

import { useMemo, useState } from "react";

type BookType = "cash" | "bank";

type Props = {
  type: BookType;
};

type Row = {
  id: string;
  date: string;
  voucher_no: string;
  description: string;
  debit: number;
  credit: number;
};

const demoRows: Row[] = [];

function money(value: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function CashBankBookPage({ type }: Props) {
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const title = type === "bank" ? "Bank Book" : "Cash Book";

  const filteredRows = useMemo(() => {
    return demoRows.filter((row) => {
      const q = search.toLowerCase();

      const matchesSearch =
        !q ||
        row.description.toLowerCase().includes(q) ||
        row.voucher_no.toLowerCase().includes(q);

      const matchesFrom = !fromDate || row.date >= fromDate;
      const matchesTo = !toDate || row.date <= toDate;

      return matchesSearch && matchesFrom && matchesTo;
    });
  }, [search, fromDate, toDate]);

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        acc.debit += row.debit || 0;
        acc.credit += row.credit || 0;
        return acc;
      },
      { debit: 0, credit: 0 }
    );
  }, [filteredRows]);

  const balance = totals.debit - totals.credit;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
              <p className="mt-1 text-sm text-slate-500">
                Cash/Bank ledger movement, debit, credit and running balance.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900 px-5 py-3 text-white">
              <p className="text-xs text-slate-300">Current Balance</p>
              <p className="text-xl font-bold">{money(balance)}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total In</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {money(totals.debit)}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Out</p>
            <p className="mt-1 text-2xl font-bold text-rose-600">
              {money(totals.credit)}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Net Balance</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {money(balance)}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search voucher / description"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-500"
            />

            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-500"
            />

            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-500"
            />

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setFromDate("");
                setToDate("");
              }}
              className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Reset Filters
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-left text-slate-600">
                <tr>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Voucher No</th>
                  <th className="px-5 py-4 font-semibold">Description</th>
                  <th className="px-5 py-4 text-right font-semibold">Debit</th>
                  <th className="px-5 py-4 text-right font-semibold">Credit</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Balance
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <div className="mx-auto max-w-md">
                        <p className="text-base font-semibold text-slate-800">
                          No entries found
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Abhi {title} me koi transaction available nahi.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="px-5 py-4">{row.date}</td>
                      <td className="px-5 py-4">{row.voucher_no}</td>
                      <td className="px-5 py-4">{row.description}</td>
                      <td className="px-5 py-4 text-right">
                        {money(row.debit)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {money(row.credit)}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold">
                        {money(row.debit - row.credit)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}