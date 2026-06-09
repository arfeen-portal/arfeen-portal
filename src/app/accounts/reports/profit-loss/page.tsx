"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ApiData = any;

function money(value: number) {
  return new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function StatCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">{value}</h2>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

export default function ProfitLossReportPage() {
  const router = useRouter();

  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);

  const [showRecovery, setShowRecovery] = useState(false);
  const [cfoMode, setCfoMode] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [revenueLift, setRevenueLift] = useState(10);
  const [expenseCut, setExpenseCut] = useState(5);
  const [supplierCut, setSupplierCut] = useState(3);
  const [priceIncrease, setPriceIncrease] = useState(2);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);

      const res = await fetch(`/api/accounts/profit-loss?${params.toString()}`, {
        cache: "no-store",
      });

      const json = await res.json();
      setData(json);
    } catch (error: any) {
      setData({
        ok: false,
        error: error?.message || "Failed to load Profit & Loss data",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = data?.summary || {};
  const cfo = data?.cfo || {};
  const plan = data?.recoveryPlan || { actions: [] };

  const chartData = useMemo(() => {
    return (data?.trends || []).map((r: any) => ({
      month: String(r.month || "").slice(0, 7),
      revenue: Number(r.revenue || 0),
      expenses: Number(r.expenses || 0),
      profit: Number(r.profit || 0),
    }));
  }, [data]);

  const simulation = useMemo(() => {
    const totalRevenue = Number(s.totalRevenue || 0);
    const totalExpenses = Number(s.totalExpenses || 0);
    const netProfit = Number(s.netProfit || 0);

    const simulatedRevenue =
      totalRevenue * (1 + revenueLift / 100 + priceIncrease / 100);

    const simulatedExpenses =
      totalExpenses * Math.max(0, 1 - expenseCut / 100 - supplierCut / 100);

    const simulatedProfit = simulatedRevenue - simulatedExpenses;

    return {
      simulatedRevenue,
      simulatedExpenses,
      simulatedProfit,
      simulatedMargin:
        simulatedRevenue > 0 ? (simulatedProfit / simulatedRevenue) * 100 : 0,
      improvement: simulatedProfit - netProfit,
    };
  }, [s, revenueLift, expenseCut, supplierCut, priceIncrease]);

  function applyScenario(type: "growth" | "saving" | "ramadan" | "crisis") {
    if (type === "growth") {
      setRevenueLift(20);
      setExpenseCut(5);
      setSupplierCut(5);
      setPriceIncrease(4);
    }

    if (type === "saving") {
      setRevenueLift(5);
      setExpenseCut(15);
      setSupplierCut(10);
      setPriceIncrease(1);
    }

    if (type === "ramadan") {
      setRevenueLift(30);
      setExpenseCut(3);
      setSupplierCut(7);
      setPriceIncrease(8);
    }

    if (type === "crisis") {
      setRevenueLift(0);
      setExpenseCut(25);
      setSupplierCut(15);
      setPriceIncrease(0);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          Loading AI Profit & Loss Command Center...
        </div>
      </div>
    );
  }

  if (!data?.ok) {
    return (
      <div className="p-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700">
          <h1 className="text-2xl font-black">Profit/Loss Error</h1>
          <p className="mt-2">{data?.error || "Unknown error"}</p>
        </div>
      </div>
    );
  }

  const isRecoveryRequired = Boolean(data?.recoveryPlan?.required);

  return (
    <div
      className={`min-h-screen p-6 text-slate-950 print:bg-white ${
        isRecoveryRequired ? "bg-red-50" : "bg-slate-50"
      }`}
    >
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center print:hidden">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">
            Arfeen AI Finance Intelligence
          </p>
          <h1 className="mt-2 text-3xl font-black">
            Profit & Loss Command Center
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            AI CFO Assistant, Profit Simulation, Travel Profit DNA, Recovery
            Strategy, and Executive PDF.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold"
          />

          <button
            onClick={() => setCfoMode((v) => !v)}
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
          >
            {cfoMode ? "Normal View" : "AI CFO Mode"}
          </button>

          <button
            onClick={() => setShowRecovery(true)}
            className="rounded-2xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950"
          >
            AI CFO Recovery Strategy
          </button>

          <button
            onClick={() => window.print()}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black"
          >
            Executive PDF
          </button>

          <button
            onClick={loadData}
            className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white"
          >
            Refresh
          </button>
        </div>
      </div>

      <div
        className={`mb-6 rounded-3xl border p-5 shadow-sm ${
          isRecoveryRequired
            ? "border-red-300 bg-red-50"
            : "border-blue-200 bg-blue-50"
        }`}
      >
        <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-700">
          AI CFO Assistant
        </p>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">
          {cfo.boardRecommendation || s.insight}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-5">
        <StatCard title="Total Revenue" value={`PKR ${money(s.totalRevenue)}`} />
        <StatCard title="Total Expenses" value={`PKR ${money(s.totalExpenses)}`} />
        <StatCard
          title="Net Profit / Loss"
          value={`PKR ${money(s.netProfit)}`}
          sub={`${Number(s.netMargin || 0).toFixed(1)}% margin`}
        />
        <StatCard
          title="AI Health Score"
          value={`${s.healthScore || 0}/100`}
          sub="CFO-grade risk signal"
        />
        <StatCard
          title="Forecast Profit"
          value={`PKR ${money(s.forecastProfit)}`}
          sub="Next trend estimate"
        />
      </div>

      {cfoMode ? (
        <div
          className={`mb-6 rounded-3xl border p-6 ${
            isRecoveryRequired
              ? "border-red-300 bg-red-50"
              : "border-blue-200 bg-blue-50"
          }`}
        >
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-black text-blue-950">AI CFO Mode</h2>
              <p className="mt-1 text-sm text-blue-700">
                Decision intelligence for margin risk, cash survival, supplier
                savings, segment weakness, and board-level action.
              </p>
            </div>

            <div className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-blue-950 shadow-sm">
              Risk Meter: {cfo.riskMeter || "Safe"}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-xs font-bold text-slate-500">Cash Burn Days</p>
              <p className="mt-2 text-2xl font-black">
                {cfo.cashBurnDays === 999 ? "Safe" : `${cfo.cashBurnDays || 0} days`}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-xs font-bold text-slate-500">
                Supplier Saving Potential
              </p>
              <p className="mt-2 text-2xl font-black">
                PKR {money(cfo.supplierSavingPotential)}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-xs font-bold text-slate-500">
                Growth Opportunity
              </p>
              <p className="mt-2 text-2xl font-black">
                PKR {money(cfo.opportunityValue)}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-xs font-bold text-slate-500">Rows Analysed</p>
              <p className="mt-2 text-2xl font-black">
                {money(Number(data?.rowsCount || 0))}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-xs font-bold text-slate-500">Best Segment</p>
              <p className="mt-2 text-lg font-black">
                {cfo.bestSegment || "No segment found"}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-xs font-bold text-slate-500">Weak Segment</p>
              <p className="mt-2 text-lg font-black">
                {cfo.weakSegment || "No weak segment found"}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-3">
          <h2 className="mb-4 text-lg font-black">Monthly Profit Trend</h2>
          <div className="h-80 print:hidden">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.15}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#f97316"
                  fill="#f97316"
                  fillOpacity={0.12}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.12}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
          <h2 className="text-lg font-black text-red-950">Critical Alerts</h2>
          <div className="mt-4 space-y-3">
            {(data?.alerts || []).length === 0 ? (
              <div className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm">
                No critical alert found.
              </div>
            ) : (
              data.alerts.map((a: any, i: number) => (
                <div key={i} className="rounded-2xl bg-white p-4 text-sm shadow-sm">
                  <p className="font-black">{a.title}</p>
                  <p className="mt-1 text-slate-600">{a.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-purple-200 bg-purple-50 p-6 shadow-sm print:hidden">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-black text-purple-950">
              Profit Simulation Engine
            </h2>
            <p className="mt-1 text-sm text-purple-700">
              Scenario planning for growth, saving, Ramadan demand, and crisis
              recovery.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyScenario("growth")}
              className="rounded-xl bg-white px-4 py-2 text-xs font-black shadow-sm"
            >
              Aggressive Growth
            </button>
            <button
              onClick={() => applyScenario("saving")}
              className="rounded-xl bg-white px-4 py-2 text-xs font-black shadow-sm"
            >
              Cost Saving
            </button>
            <button
              onClick={() => applyScenario("ramadan")}
              className="rounded-xl bg-white px-4 py-2 text-xs font-black shadow-sm"
            >
              Ramadan Strategy
            </button>
            <button
              onClick={() => applyScenario("crisis")}
              className="rounded-xl bg-white px-4 py-2 text-xs font-black shadow-sm"
            >
              Crisis Mode
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-4">
          {[
            ["Revenue Lift", revenueLift, setRevenueLift],
            ["Expense Cut", expenseCut, setExpenseCut],
            ["Supplier Cost Cut", supplierCut, setSupplierCut],
            ["Package Price Increase", priceIncrease, setPriceIncrease],
          ].map(([label, value, setter]: any) => (
            <div key={label} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex justify-between text-sm font-bold">
                <span>{label}</span>
                <span>{value}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={value}
                onChange={(e) => setter(Number(e.target.value))}
                className="mt-4 w-full"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard
            title="Simulated Revenue"
            value={`PKR ${money(simulation.simulatedRevenue)}`}
          />
          <StatCard
            title="Simulated Expenses"
            value={`PKR ${money(simulation.simulatedExpenses)}`}
          />
          <StatCard
            title="Simulated Profit"
            value={`PKR ${money(simulation.simulatedProfit)}`}
          />
          <StatCard
            title="Profit Improvement"
            value={`PKR ${money(simulation.improvement)}`}
            sub={`${simulation.simulatedMargin.toFixed(1)}% future margin`}
          />
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-black">Travel Profit DNA</h2>

        {(data.travelProfitDNA || []).length ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
            {(data.travelProfitDNA || []).map((r: any) => (
              <div
                key={r.product}
                className={`rounded-2xl border p-4 ${
                  Number(r.margin || 0) < 10 && Number(r.revenue || 0) > 0
                    ? "border-red-200 bg-red-50"
                    : "border-slate-100 bg-slate-50"
                }`}
              >
                <p className="text-xs font-black uppercase text-slate-500">
                  {r.product}
                </p>
                <p className="mt-2 text-xl font-black">PKR {money(r.profit)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {Number(r.margin || 0).toFixed(1)}% margin
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Revenue PKR {money(r.revenue)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-400">
            No travel segment data found
          </div>
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-black">Top Expense Leak Detector</h2>
          {data.topExpenses?.length ? (
            <div className="h-72 print:hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topExpenses}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="account_name" hide />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#f97316" radius={[12, 12, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-400">
              No expense leak found
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-black">AI Profit Radar</h2>
          <p className="text-sm leading-7 text-slate-700">{s.insight}</p>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Expense Ratio</p>
              <h3 className="mt-1 text-2xl font-black">
                {Number(s.expenseRatio || 0).toFixed(1)}%
              </h3>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Break-even Gap</p>
              <h3 className="mt-1 text-2xl font-black">
                PKR {money(s.breakEvenGap)}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-black">Top Expense Accounts</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-3">Account</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>

            <tbody>
              {(data.topExpenses || []).map((r: any, i: number) => (
                <tr
                  key={i}
                  onClick={() =>
                    router.push(
                      r.account_id
                        ? `/accounts/ledger?account_id=${encodeURIComponent(
                            r.account_id
                          )}`
                        : `/accounts/ledger?account_name=${encodeURIComponent(
                            r.account_name
                          )}`
                    )
                  }
                  className="cursor-pointer border-b hover:bg-slate-50"
                >
                  <td className="p-3 font-medium">{r.account_name}</td>
                  <td className="p-3 text-right font-black">
                    PKR {money(r.amount)}
                  </td>
                </tr>
              ))}

              {!data.topExpenses?.length ? (
                <tr>
                  <td colSpan={2} className="p-8 text-center text-slate-400">
                    No expense data loaded
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {showRecovery ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:hidden">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-600">
                  AI CFO Recovery Strategy
                </p>
                <h2 className="mt-2 text-2xl font-black">{plan.title}</h2>
              </div>

              <button
                onClick={() => setShowRecovery(false)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <StatCard
                title="Break-even Gap"
                value={`PKR ${money(plan.breakEvenGap)}`}
              />
              <StatCard
                title="Expense Cut Target"
                value={`PKR ${money(plan.expenseCutTarget)}`}
              />
              <StatCard
                title="Revenue Growth Target"
                value={`PKR ${money(plan.revenueGrowthTarget)}`}
              />
              <StatCard
                title="Daily Recovery Target"
                value={`PKR ${money(plan.dailyRecoveryTarget)}`}
              />
            </div>

            <div className="mt-6 rounded-3xl bg-slate-50 p-5">
              <h3 className="font-black">Recommended Actions</h3>
              <div className="mt-4 space-y-3">
                {(plan.actions || []).map((x: string, i: number) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-white p-4 text-sm shadow-sm"
                  >
                    {i + 1}. {x}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="rounded-2xl border px-5 py-3 text-sm font-black"
              >
                Print Strategy
              </button>

              <button
                onClick={() => router.push("/accounts/ledger")}
                className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white"
              >
                Open Ledger
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}