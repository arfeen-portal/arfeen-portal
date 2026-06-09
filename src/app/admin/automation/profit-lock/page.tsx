"use client";

import { useEffect, useState } from "react";

export default function ProfitLockPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [productType, setProductType] = useState("transport");
  const [saleAmount, setSaleAmount] = useState("15000");
  const [costAmount, setCostAmount] = useState("13000");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/automation/profit-lock")
      .then((res) => res.json())
      .then((json) => setRules(json.rules || []));
  }, []);

  async function checkProfit() {
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/admin/automation/profit-lock", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_type: productType,
        sale_amount: Number(saleAmount),
        cost_amount: Number(costAmount),
      }),
    });

    const json = await res.json();
    setResult(json);
    setLoading(false);
  }

  const badge =
    result?.decision === "allowed"
      ? "bg-emerald-100 text-emerald-800"
      : result?.decision === "rejected"
        ? "bg-red-100 text-red-800"
        : "bg-amber-100 text-amber-800";

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-amber-700 to-slate-950 p-8 text-white shadow">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-200">
            Admin Automation
          </p>
          <h1 className="mt-2 text-3xl font-bold">Profit Lock System</h1>
          <p className="mt-2 max-w-3xl text-amber-100">
            Minimum margin enforce karta hai. Low profit booking par warning ya reject decision deta hai.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
            <h2 className="text-xl font-bold text-slate-900">Check Booking Profit</h2>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-600"
              >
                <option value="transport">Transport</option>
                <option value="hotel">Hotel</option>
                <option value="umrah">Umrah</option>
              </select>

              <input
                value={saleAmount}
                onChange={(e) => setSaleAmount(e.target.value)}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-600"
                placeholder="Sale amount"
              />

              <input
                value={costAmount}
                onChange={(e) => setCostAmount(e.target.value)}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-600"
                placeholder="Cost amount"
              />
            </div>

            <button
              onClick={checkProfit}
              disabled={loading}
              className="mt-5 rounded-2xl bg-amber-700 px-6 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {loading ? "Checking..." : "Check Profit Lock"}
            </button>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Active Rules</h3>

            <div className="mt-4 space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className="rounded-2xl bg-slate-50 p-4 text-sm">
                  <p className="font-bold capitalize text-slate-900">{rule.product_type}</p>
                  <p className="mt-1 text-slate-600">
                    Minimum: {rule.minimum_margin_value} {rule.minimum_margin_type}
                  </p>
                  <p className="text-slate-600">Action: {rule.action}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {result && (
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            {result.error ? (
              <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
                {result.error}
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-bold text-slate-900">Profit Decision</h2>
                  <span className={`rounded-full px-4 py-2 text-sm font-bold ${badge}`}>
                    {result.decision}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-5">
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Sale</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{result.sale_amount}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Cost</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{result.cost_amount}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Profit</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{result.profit_amount}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Margin</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{result.margin_percent}%</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-sm text-slate-500">Required</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{result.required_margin}</p>
                  </div>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}