"use client";

import { useEffect, useMemo, useState } from "react";

type AgentScore = {
  agent_id: string | null;
  agent_code: string;
  agent_name: string;
  total_bookings: number;
  total_revenue: number;
  total_profit: number;
  confirmed_bookings: number;
  pending_bookings: number;
  loss_bookings: number;
  score: number;
  grade: string;
};

function money(value: number) {
  return new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(Number(value || 0));
}

function gradeClass(grade: string) {
  if (grade === "A+") return "bg-emerald-100 text-emerald-700";
  if (grade === "A") return "bg-blue-100 text-blue-700";
  if (grade === "B") return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

export default function AgentScoringPage() {
  const [rows, setRows] = useState<AgentScore[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/accounts/agent-scoring", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => setRows(json.data || []));
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) =>
      `${r.agent_name || ""} ${r.agent_code || ""}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [rows, search]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-slate-950 to-emerald-950 p-6 text-white shadow-xl">
        <p className="text-sm text-emerald-200">Agent Intelligence</p>
        <h1 className="mt-2 text-3xl font-bold">Agent Scoring</h1>
        <p className="mt-2 text-sm text-slate-300">
          Score agents by booking volume, confirmations, revenue, profit and loss-risk behavior.
        </p>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <Card title="Total Agents" value={rows.length} />
        <Card title="A+ Agents" value={rows.filter((r) => r.grade === "A+").length} />
        <Card title="Risk Agents" value={rows.filter((r) => r.grade === "C").length} />
        <Card title="Loss Bookings" value={rows.reduce((s, r) => s + Number(r.loss_bookings || 0), 0)} />
      </section>

      <div className="mb-5">
        <input
          className="w-full rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm outline-none focus:border-blue-500"
          placeholder="Search agent by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3 text-right">Bookings</th>
              <th className="px-4 py-3 text-right">Confirmed</th>
              <th className="px-4 py-3 text-right">Pending</th>
              <th className="px-4 py-3 text-right">Revenue</th>
              <th className="px-4 py-3 text-right">Profit</th>
              <th className="px-4 py-3 text-right">Loss Jobs</th>
              <th className="px-4 py-3 text-right">Score</th>
              <th className="px-4 py-3">Grade</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={`${r.agent_code}-${r.agent_name}`} className="border-t hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold text-slate-950">{r.agent_name || "-"}</td>
                <td className="px-4 py-3">{r.agent_code || "-"}</td>
                <td className="px-4 py-3 text-right">{r.total_bookings}</td>
                <td className="px-4 py-3 text-right">{r.confirmed_bookings}</td>
                <td className="px-4 py-3 text-right">{r.pending_bookings}</td>
                <td className="px-4 py-3 text-right">PKR {money(r.total_revenue)}</td>
                <td className="px-4 py-3 text-right font-bold text-emerald-600">PKR {money(r.total_profit)}</td>
                <td className="px-4 py-3 text-right text-red-600">{r.loss_bookings}</td>
                <td className="px-4 py-3 text-right font-bold">{r.score}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${gradeClass(r.grade)}`}>
                    {r.grade}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}