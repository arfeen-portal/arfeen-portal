"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  Boxes,
  Brain,
  Building2,
  CheckCircle2,
  Factory,
  Globe2,
  MessageCircle,
  PackagePlus,
  Radar,
  ShieldAlert,
  Star,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

type SuiteItem = {
  id: string;
  module_key: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  score: number;
  revenue_impact: number;
  risk_level: string;
  summary: string | null;
  ai_recommendation: string | null;
  metadata: {
    features?: string[];
  } | null;
};

const iconMap: Record<string, any> = {
  shared_inventory_marketplace: Boxes,
  ai_whatsapp_crm: MessageCircle,
  smart_package_generator: PackagePlus,
  ai_booking_copilot: Bot,
  live_pilgrim_command_center: Radar,
  crisis_management_engine: ShieldAlert,
  white_label_app_factory: Factory,
  supplier_intelligence_network: Building2,
  trust_score_system: Star,
  ai_negotiation_assistant: Brain,
};

export default function TravelIntelligenceSuitePage() {
  const [items, setItems] = useState<SuiteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/admin/travel-intelligence-suite", {
          cache: "no-store",
        });
        const json = await res.json();
        setItems(json.items ?? []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const categories = useMemo(() => {
    return ["All", ...Array.from(new Set(items.map((item) => item.category)))];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === "All") return items;
    return items.filter((item) => item.category === selectedCategory);
  }, [items, selectedCategory]);

  const totalRevenue = items.reduce(
    (sum, item) => sum + Number(item.revenue_impact || 0),
    0
  );

  const averageScore =
    items.length > 0
      ? Math.round(items.reduce((sum, item) => sum + Number(item.score || 0), 0) / items.length)
      : 0;

  const criticalCount = items.filter((item) => item.priority === "critical").length;
  const highRiskCount = items.filter((item) => item.risk_level === "high").length;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-sm text-cyan-200">
                <Zap className="h-4 w-4" />
                Advanced Travel AI Operating Layer
              </div>
              <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
                Travel Intelligence Suite
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                Shared Inventory Marketplace, AI WhatsApp CRM, Smart Package Generator,
                AI Booking Copilot, Live Pilgrim Command Center, Crisis Management,
                White-label App Factory, Supplier Intelligence, Trust Score and AI Negotiation.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
              <p className="text-sm text-slate-300">Suite Health</p>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-5xl font-black">{averageScore}</span>
                <span className="mb-2 text-sm text-emerald-300">/100 AI Score</span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <StatCard icon={Globe2} label="Active Systems" value={items.length.toString()} />
            <StatCard icon={TrendingUp} label="Revenue Impact" value={`SAR ${totalRevenue.toLocaleString()}`} />
            <StatCard icon={CheckCircle2} label="Critical Modules" value={criticalCount.toString()} />
            <StatCard icon={ShieldAlert} label="High Risk Alerts" value={highRiskCount.toString()} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                selectedCategory === category
                  ? "border-cyan-300 bg-cyan-300 text-slate-950"
                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-slate-300">
            Loading intelligence suite...
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {filteredItems.map((item) => {
              const Icon = iconMap[item.module_key] ?? Brain;

              return (
                <div
                  key={item.id}
                  className="group rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl transition hover:border-cyan-300/40 hover:bg-white/[0.07]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-300">
                        <Icon className="h-7 w-7" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{item.title}</h2>
                        <p className="text-sm text-slate-400">{item.category}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black text-emerald-300">
                        {Number(item.score || 0)}
                      </div>
                      <p className="text-xs text-slate-400">AI Score</p>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-6 text-slate-300">
                    {item.summary}
                  </p>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    <MiniMetric label="Priority" value={item.priority} />
                    <MiniMetric label="Risk" value={item.risk_level} />
                    <MiniMetric
                      label="Impact"
                      value={`SAR ${Number(item.revenue_impact || 0).toLocaleString()}`}
                    />
                  </div>

                  <div className="mt-5">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Core Features
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(item.metadata?.features ?? []).map((feature) => (
                        <span
                          key={feature}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                    <div className="flex gap-3">
                      <Brain className="mt-0.5 h-5 w-5 text-amber-300" />
                      <div>
                        <p className="text-sm font-semibold text-amber-200">
                          AI Recommendation
                        </p>
                        <p className="mt-1 text-sm leading-6 text-amber-100/90">
                          {item.ai_recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-xl backdrop-blur">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
        <Icon className="h-6 w-6 text-cyan-300" />
      </div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold capitalize text-white">{value}</p>
    </div>
  );
}