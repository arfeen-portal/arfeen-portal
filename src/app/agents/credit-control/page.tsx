"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Search,
  ShieldAlert,
  TrendingDown,
  Users,
} from "lucide-react";

const agents = [
  {
    name: "Al Madina Travels",
    code: "AG-1001",
    creditLimit: "SAR 50,000",
    used: "SAR 31,400",
    balance: "SAR 18,600",
    risk: "Low",
    status: "Allowed",
  },
  {
    name: "Noor Hajj & Umrah",
    code: "AG-1002",
    creditLimit: "SAR 35,000",
    used: "SAR 34,200",
    balance: "SAR 800",
    risk: "High",
    status: "Warning",
  },
  {
    name: "Global Ziyarah Services",
    code: "AG-1003",
    creditLimit: "SAR 75,000",
    used: "SAR 82,000",
    balance: "-SAR 7,000",
    risk: "Critical",
    status: "Blocked",
  },
];

export default function AgentCreditControlPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-rose-700 to-orange-600 p-6 text-white shadow-sm">
          <div>
            <p className="text-sm text-rose-100">Agents / Credit Control</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Agent Credit Control
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-rose-100">
              Monitor credit limits, outstanding balances, blocked agents, and
              risk alerts before new bookings are approved.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            {
              label: "Total Credit Limit",
              value: "SAR 1.25M",
              icon: CreditCard,
            },
            {
              label: "Used Credit",
              value: "SAR 745K",
              icon: TrendingDown,
            },
            {
              label: "Blocked Agents",
              value: "7",
              icon: ShieldAlert,
            },
            {
              label: "Healthy Agents",
              value: "94",
              icon: Users,
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
                  <div className="rounded-2xl bg-rose-50 p-3 text-rose-700">
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
                Credit Monitoring
              </h2>
              <p className="text-sm text-slate-500">
                Agent-wise credit exposure and booking permission status.
              </p>
            </div>

            <div className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 lg:w-80">
              <Search size={18} className="text-slate-400" />
              <input
                placeholder="Search agent..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Limit</th>
                  <th className="px-4 py-3">Used</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {agents.map((agent) => (
                  <tr key={agent.code} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-900">
                        {agent.name}
                      </div>
                      <div className="text-xs text-slate-500">{agent.code}</div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {agent.creditLimit}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{agent.used}</td>
                    <td className="px-4 py-4 font-bold text-slate-900">
                      {agent.balance}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                          agent.risk === "Critical"
                            ? "bg-red-50 text-red-700"
                            : agent.risk === "High"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {agent.risk === "Low" ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <AlertTriangle size={14} />
                        )}
                        {agent.risk}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-700">
                      {agent.status}
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