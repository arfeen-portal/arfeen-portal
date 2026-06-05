"use client";

import {
  ArrowDownCircle,
  ArrowUpCircle,
  Download,
  FileText,
  Search,
  Wallet,
} from "lucide-react";

const statements = [
  {
    date: "2026-05-01",
    agent: "Al Madina Travels",
    ref: "INV-2401",
    debit: "SAR 12,500",
    credit: "SAR 0",
    balance: "SAR 12,500",
    type: "Booking Invoice",
  },
  {
    date: "2026-05-03",
    agent: "Al Madina Travels",
    ref: "RCPT-1182",
    debit: "SAR 0",
    credit: "SAR 7,000",
    balance: "SAR 5,500",
    type: "Payment Received",
  },
  {
    date: "2026-05-05",
    agent: "Noor Hajj & Umrah",
    ref: "INV-2408",
    debit: "SAR 18,200",
    credit: "SAR 0",
    balance: "SAR 18,200",
    type: "Umrah Package",
  },
];

export default function AgentStatementsPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-blue-800 p-6 text-white shadow-sm">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm text-blue-100">Agents / Statements</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                Agent Statements
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-blue-100">
                View agent ledger summaries, debit/credit entries, outstanding
                balances, invoices, receipts, and settlement history.
              </p>
            </div>

            <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50">
              <Download size={18} />
              Export Statement
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            {
              label: "Total Debit",
              value: "SAR 428K",
              icon: ArrowUpCircle,
            },
            {
              label: "Total Credit",
              value: "SAR 316K",
              icon: ArrowDownCircle,
            },
            {
              label: "Outstanding",
              value: "SAR 112K",
              icon: Wallet,
            },
            {
              label: "Statements",
              value: "248",
              icon: FileText,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {item.value}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                    <Icon size={22} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Statement Entries
              </h2>
              <p className="text-sm text-slate-500">
                Agent-wise accounting activity with running balance.
              </p>
            </div>

            <div className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 lg:w-80">
              <Search size={18} className="text-slate-400" />
              <input
                placeholder="Search agent, ref, type..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Debit</th>
                  <th className="px-4 py-3">Credit</th>
                  <th className="px-4 py-3">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {statements.map((row) => (
                  <tr key={`${row.ref}-${row.date}`} className="hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-600">{row.date}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {row.agent}
                    </td>
                    <td className="px-4 py-4 text-blue-700 font-semibold">
                      {row.ref}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{row.type}</td>
                    <td className="px-4 py-4 text-red-600">{row.debit}</td>
                    <td className="px-4 py-4 text-emerald-600">
                      {row.credit}
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-900">
                      {row.balance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}