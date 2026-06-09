"use client";

import { useEffect, useMemo, useState } from "react";
import { Brain, LineChart, ShieldAlert, Sparkles, TrendingUp, Zap } from "lucide-react";

type Prediction = {
  id: string;
  title: string;
  category: string;
  confidence: number;
  impact: string;
  recommendation: string;
};

export default function PredictionEnginePage() {
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/ai/prediction-engine", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load prediction engine");
        const json = await res.json();
        setPredictions(Array.isArray(json?.predictions) ? json.predictions : []);
      } catch (err: any) {
        setError(err?.message || "Something went wrong");
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const avgConfidence = useMemo(() => {
    if (!predictions.length) return 0;
    return Math.round(
      predictions.reduce((sum, p) => sum + Number(p.confidence || 0), 0) /
        predictions.length
    );
  }, [predictions]);

  return (
    <main className="min-h-screen bg-[#050816] p-6 text-white">
      <section className="rounded-[28px] border border-white/10 bg-gradient-to-br from-blue-950 via-slate-950 to-indigo-950 shadow-2xl">
        <div className="p-7">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
                <Brain className="h-4 w-4" />
                AI Forecasting Layer
              </div>
              <h1 className="text-4xl font-black">Prediction Engine</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Forecast demand, risky agents, route pressure, package movement,
                revenue leakage, and operational workload before it happens.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-400">Average Confidence</p>
              <h2 className="text-4xl font-black text-cyan-200">{avgConfidence}%</h2>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-950/40 p-4 text-red-100">
              {error}
            </div>
          )}

          <div className="mb-7 grid gap-4 md:grid-cols-3">
            <Stat icon={<TrendingUp />} title="Demand Signals" value="Live" />
            <Stat icon={<ShieldAlert />} title="Risk Detection" value="Active" />
            <Stat icon={<Zap />} title="Auto Suggestions" value={predictions.length} />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <h2 className="mb-5 text-xl font-bold">AI Predictions</h2>

            {loading ? (
              <p className="text-sm text-slate-400">Loading predictions...</p>
            ) : predictions.length === 0 ? (
              <p className="text-sm text-slate-400">No predictions yet.</p>
            ) : (
              <div className="grid gap-5 lg:grid-cols-3">
                {predictions.map((item) => (
                  <div key={item.id} className="rounded-3xl border border-white/10 bg-slate-950/80 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="rounded-full bg-blue-400/10 px-3 py-1 text-xs text-blue-200">
                        {item.category}
                      </span>
                      <span className="text-sm font-bold text-emerald-300">
                        {item.confidence}%
                      </span>
                    </div>

                    <h3 className="text-lg font-bold">{item.title}</h3>

                    <div className="mt-4 rounded-2xl bg-white/[0.04] p-4">
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Recommendation
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {item.recommendation}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-slate-400">Impact</span>
                      <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-cyan-200">
                        {item.impact}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ icon, title, value }: { icon: React.ReactNode; title: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
      <div className="mb-3 inline-flex rounded-2xl bg-cyan-400/10 p-3 text-cyan-200">
        {icon}
      </div>
      <p className="text-sm text-slate-400">{title}</p>
      <h3 className="mt-2 text-2xl font-black">{value}</h3>
    </div>
  );
}