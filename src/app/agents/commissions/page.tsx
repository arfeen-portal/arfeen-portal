"use client";

import {
  BadgePercent,
  Plus,
  Search,
  TrendingUp,
  Users,
  Wallet,
  ShieldCheck,
} from "lucide-react";

const rules = [
  {
    agent: "Al Madina Travels",
    code: "AG-1001",
    product: "Umrah Package",
    type: "Percentage",
    value: "5%",
    status: "Active",
  },
  {
    agent: "Noor Hajj & Umrah",
    code: "AG-1002",
    product: "Transport",
    type: "Fixed",
    value: "SAR 40",
    status: "Active",
  },
  {
    agent: "Global Ziyarah Services",
    code: "AG-1003",
    product: "Hotel Booking",
    type: "Percentage",
    value: "3.5%",
    status: "Review",
  },
];

export default function AgentCommissionsPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white shadow-sm">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-sm text-blue-100">Agents / Commission Rules</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                Agent Commission Rules
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-blue-100">
                Manage product-wise commission logic for Umrah, transport,
                hotels, tickets, and custom agent deals.
              </p>
            </div>

            <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50">
              <Plus size={18} />
              New Rule
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            {
              label: "Active Rules",
              value: "38",
              icon: BadgePercent,
            },
            {
              label: "Total Agents",
              value: "126",
              icon: Users,
            },
            {
              label: "Avg Commission",
              value: "4.8%",
              icon: TrendingUp,
            },
            {
              label: "Monthly Payout",
              value: "SAR 42,500",
              icon: Wallet,
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
                Commission Rules List
              </h2>
              <p className="text-sm text-slate-500">
                Product-wise commission configuration and approval status.
              </p>
            </div>

            <div className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 lg:w-80">
              <Search size={18} className="text-slate-400" />
              <input
                placeholder="Search agent or product..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {rules.map((rule) => (
                  <tr key={rule.code} className="hover:bg-slate-50">
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {rule.agent}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{rule.code}</td>
                    <td className="px-4 py-4 text-slate-600">
                      {rule.product}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{rule.type}</td>
                    <td className="px-4 py-4 font-bold text-blue-700">
                      {rule.value}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        <ShieldCheck size={14} />
                        {rule.status}
                      </span>
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