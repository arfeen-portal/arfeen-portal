"use client";

import { useEffect, useMemo, useState } from "react";

type DecisionData = {
  total_bookings: number;
  revenue: number;
  cost: number;
  commission: number;
  estimated_profit: number;
  pending_bookings: number;
  confirmed_bookings: number;
  negative_profit_bookings: number;
  incomplete_pricing_bookings: number;
  ai_recommendation: string;
};

function money(value: number) {
  return new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function AiDecisionPage() {
  const [data, setData] = useState<DecisionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await fetch("/api/accounts/ai-decision", { cache: "no-store" });
      const json = await res.json();

      if (!json.ok) {
        setError(json.error || "Failed to load AI decision data.");
      } else {
        setData(json.data);
      }

      setLoading(false);
    }

    loadData();
  }, []);

  const margin = useMemo(() => {
    if (!data || !data.revenue) return 0;
    return ((data.estimated_profit / data.revenue) * 100).toFixed(1);
  }, [data]);

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Loading AI decision widget...</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-slate-950 to-blue-950 p-6 text-white shadow-xl">
        <p className="text-sm text-blue-100">Accounts Intelligence</p>
        <h1 className="mt-2 text-3xl font-bold">AI Decision Widget</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-200">
          Automatic decision layer for revenue, margin, commission pressure, pending bookings and pricing risk.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Revenue", `PKR ${money(data?.revenue || 0)}`],
          ["Estimated Profit", `PKR ${money(data?.estimated_profit || 0)}`],
          ["Profit Margin", `${margin}%`],
          ["Total Bookings", data?.total_bookings || 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Pending Bookings</p>
          <p className="mt-3 text-3xl font-bold text-amber-600">{data?.pending_bookings || 0}</p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Negative Profit Risk</p>
          <p className="mt-3 text-3xl font-bold text-red-600">{data?.negative_profit_bookings || 0}</p>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Incomplete Pricing</p>
          <p className="mt-3 text-3xl font-bold text-orange-600">{data?.incomplete_pricing_bookings || 0}</p>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">AI Recommendation</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">{data?.ai_recommendation}</h2>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Action 1</p>
            <p className="mt-1 font-semibold text-slate-900">Review profit leak bookings daily.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Action 2</p>
            <p className="mt-1 font-semibold text-slate-900">Block bookings with missing sale or cost.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Action 3</p>
            <p className="mt-1 font-semibold text-slate-900">Review agent commission above 25%.</p>
          </div>
        </div>
      </section>
    </main>
  );
}