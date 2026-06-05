"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/reports/StatCard";
import BarList from "@/components/reports/BarList";
import SimpleTable from "@/components/reports/SimpleTable";

type FinancialAnalyticsResponse = {
  ok: boolean;
  filters: { from: string; to: string };
  kpis: {
    revenue: string;
    netProfit: string;
    commission: string;
    receivables: string;
    payables: string;
    margin: string;
    riskAlerts: number;
    cashPressure: string;
  };
  monthly: Array<{
    month: string;
    revenue: number;
    cost: number;
    profit: number;
  }>;
  categories: Array<{
    category: string;
    revenue: number;
    cost: number;
    profit: number;
    margin: string;
  }>;
  risks: Array<{
    title: string;
    level: string;
    impact: string;
  }>;
};

function defaultRange() {
  const to = new Date();
  const from = new Date();

  from.setDate(to.getDate() - 29);

  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function fallbackAnalyticsData(
  from: string,
  to: string
): FinancialAnalyticsResponse {
  return {
    ok: true,
    filters: { from, to },
    kpis: {
      revenue: "PKR 31,840,000",
      netProfit: "PKR 6,170,000",
      commission: "PKR 2,145,000",
      receivables: "PKR 4,190,000",
      payables: "PKR 2,960,000",
      margin: "19.37%",
      riskAlerts: 7,
      cashPressure: "Medium",
    },
    monthly: [
      { month: "Jan", revenue: 18400000, cost: 14200000, profit: 4200000 },
      { month: "Feb", revenue: 21300000, cost: 15900000, profit: 5400000 },
      { month: "Mar", revenue: 24800000, cost: 18400000, profit: 6400000 },
      { month: "Apr", revenue: 27100000, cost: 20400000, profit: 6700000 },
      { month: "May", revenue: 31840000, cost: 25670000, profit: 6170000 },
    ],
    categories: [
      {
        category: "Umrah Packages",
        revenue: 14200000,
        cost: 10150000,
        profit: 4050000,
        margin: "28.52%",
      },
      {
        category: "Transport",
        revenue: 6840000,
        cost: 4290000,
        profit: 2550000,
        margin: "37.28%",
      },
      {
        category: "Hotels",
        revenue: 5130000,
        cost: 3960000,
        profit: 1170000,
        margin: "22.80%",
      },
      {
        category: "Flights / BSP",
        revenue: 2280000,
        cost: 1420000,
        profit: 860000,
        margin: "37.71%",
      },
    ],
    risks: [
      {
        title: "Agent Aging Pressure",
        level: "Medium",
        impact: "Two agents crossing safe credit cycle.",
      },
      {
        title: "Supplier Payment Load",
        level: "Medium",
        impact: "Month-end supplier payments increasing.",
      },
      {
        title: "Refund Leakage Watch",
        level: "Low",
        impact: "Refund ratio stable but should be monitored.",
      },
    ],
  };
}

export default function FinancialAnalyticsPage() {
  const range = defaultRange();

  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinancialAnalyticsResponse | null>(null);
  const [notice, setNotice] = useState("");

  async function load(currentFrom: string, currentTo: string) {
    try {
      setLoading(true);
      setNotice("");

      const res = await fetch(
        `/api/reports/financial-analytics/summary?from=${currentFrom}&to=${currentTo}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        throw new Error("API unavailable");
      }

      const json = (await res.json()) as FinancialAnalyticsResponse;
      setData(json);
    } catch {
      setData(fallbackAnalyticsData(currentFrom, currentTo));
      setNotice("Live API unavailable — showing safe demo analytics data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-[#0f172a] px-6 py-8">
      <section className="mx-auto max-w-7xl rounded-[32px] bg-white p-8 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-purple-600">
              Financial Intelligence
            </p>

            <h1 className="mt-3 text-3xl font-black text-slate-950">
              Financial Analytics Dashboard
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Revenue, commission, net performance, receivables, payables,
              margin, cash pressure and AI finance risk overview.
            </p>
          </div>

          <button
            type="button"
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            Export Analytics
          </button>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
            />

            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
            />

            <button
              type="button"
              onClick={() => load(from, to)}
              className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-bold text-white"
            >
              Apply Filter
            </button>
          </div>
        </div>

        {notice ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
            {notice}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-sm font-semibold text-slate-500">
            Loading financial analytics...
          </div>
        ) : data ? (
          <>
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Revenue" value={data.kpis.revenue} />
              <StatCard title="Net Profit" value={data.kpis.netProfit} />
              <StatCard title="Commission" value={data.kpis.commission} />
              <StatCard title="Margin" value={data.kpis.margin} />
              <StatCard title="Receivables" value={data.kpis.receivables} />
              <StatCard title="Payables" value={data.kpis.payables} />
              <StatCard title="Risk Alerts" value={String(data.kpis.riskAlerts)} />
              <StatCard title="Cash Pressure" value={data.kpis.cashPressure} />
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
              <BarList
                title="Monthly Profit Trend"
                items={data.monthly.map((item) => ({
                  label: item.month,
                  value: Number(item.profit || 0),
                }))}
              />

              <BarList
                title="Category Profitability"
                items={data.categories.map((item) => ({
                  label: item.category,
                  value: Number(item.profit || 0),
                }))}
              />
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
              <SimpleTable
                title="Category Financial Performance"
                columns={["Category", "Revenue", "Cost", "Profit", "Margin"]}
                rows={data.categories.map((item) => [
                  item.category,
                  `PKR ${Number(item.revenue || 0).toFixed(2)}`,
                  `PKR ${Number(item.cost || 0).toFixed(2)}`,
                  `PKR ${Number(item.profit || 0).toFixed(2)}`,
                  item.margin,
                ])}
              />

              <SimpleTable
                title="AI Finance Risk Watch"
                columns={["Risk", "Level", "Impact"]}
                rows={data.risks.map((item) => [
                  item.title,
                  item.level,
                  item.impact,
                ])}
              />
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}