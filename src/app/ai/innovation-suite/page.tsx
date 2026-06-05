"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle2,
  Cpu,
  Database,
  Globe2,
  LineChart,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

type InnovationModule = {
  id: string;
  name: string;
  category: string;
  status: string;
  score: number;
  priority: string;
  impact: string;
  description: string;
};

type AlertItem = {
  id: string;
  title: string;
  severity: string;
  detail: string;
};

type MetricItem = {
  title: string;
  value: string | number;
  change: string;
  icon?: string;
};

type ApiData = {
  metrics?: MetricItem[];
  modules?: InnovationModule[];
  alerts?: AlertItem[];
};

const fallbackModules: InnovationModule[] = [
  {
    id: "m1",
    name: "Real-Time Umrah Market Exchange",
    category: "Marketplace AI",
    status: "Active",
    score: 94,
    priority: "High",
    impact: "Inventory exchange, group seats, visa slots, and hotel sharing.",
    description:
      "Creates a B2B marketplace layer where agents can exchange/sell travel inventory inside your portal.",
  },
  {
    id: "m2",
    name: "AI Staff Performance Truth Engine",
    category: "AI Operations",
    status: "Active",
    score: 91,
    priority: "High",
    impact: "Detects productivity gaps, suspicious behavior, and refund abuse.",
    description:
      "Analyzes booking activity, refunds, delays, follow-ups, and sales conversion to reveal real staff performance.",
  },
  {
    id: "m3",
    name: "Pilgrim Emotion Analytics",
    category: "AI Experience",
    status: "Planning",
    score: 87,
    priority: "Medium",
    impact: "Tracks anger, satisfaction, urgency, stress, and trust signals.",
    description:
      "Reads feedback/WhatsApp tone patterns to protect pilgrim experience before complaints become serious.",
  },
  {
    id: "m4",
    name: "AI Self-Healing Accounting",
    category: "Accounting AI",
    status: "Active",
    score: 96,
    priority: "Critical",
    impact: "Auto-detects duplicate vouchers, mismatches, and missing postings.",
    description:
      "Prevents accounting damage by identifying suspicious ledgers, wrong mappings, and reconciliation issues.",
  },
];

const fallbackAlerts: AlertItem[] = [
  {
    id: "a1",
    title: "Refund anomaly pattern detected",
    severity: "High",
    detail:
      "Some refund behavior looks unusual. Review employee-wise and supplier-wise refund ratios.",
  },
  {
    id: "a2",
    title: "Supplier settlement delay risk",
    severity: "Medium",
    detail:
      "A few supplier balances may require reconciliation before closing period.",
  },
];

export default function AIInnovationSuitePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiData>({
    metrics: [],
    modules: [],
    alerts: [],
  });
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch("/api/ai/innovation-suite", {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to load AI Innovation Suite");
        }

        const json = await res.json();

        setData({
          metrics: Array.isArray(json?.metrics) ? json.metrics : [],
          modules: Array.isArray(json?.modules) ? json.modules : [],
          alerts: Array.isArray(json?.alerts) ? json.alerts : [],
        });
      } catch (err: any) {
        setError(err?.message || "Something went wrong");
        setData({
          metrics: [],
          modules: fallbackModules,
          alerts: fallbackAlerts,
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const modules = Array.isArray(data?.modules) && data.modules.length > 0 ? data.modules : fallbackModules;
  const alerts = Array.isArray(data?.alerts) && data.alerts.length > 0 ? data.alerts : fallbackAlerts;

  const stats = useMemo(() => {
    const active = modules.filter((m) => String(m?.status || "") === "Active").length;
    const ai = modules.filter((m) =>
      String(m?.category || "").toLowerCase().includes("ai")
    ).length;
    const critical = modules.filter(
      (m) => String(m?.priority || "").toLowerCase() === "critical"
    ).length;
    const score =
      modules.length > 0
        ? Math.round(
            modules.reduce((sum, m) => sum + Number(m?.score || 0), 0) /
              modules.length
          )
        : 0;

    return {
      total: modules.length,
      active,
      ai,
      critical,
      score,
    };
  }, [modules]);

  const categories = useMemo(() => {
    const list = modules
      .map((m) => String(m?.category || "General"))
      .filter(Boolean);
    return ["All", ...Array.from(new Set(list))];
  }, [modules]);

  const filteredModules = modules.filter((m) => {
    const category = String(m?.category || "");
    const name = String(m?.name || "");
    const description = String(m?.description || "");
    const matchesFilter = filter === "All" || category === filter;
    const matchesQuery =
      !query ||
      name.toLowerCase().includes(query.toLowerCase()) ||
      category.toLowerCase().includes(query.toLowerCase()) ||
      description.toLowerCase().includes(query.toLowerCase());

    return matchesFilter && matchesQuery;
  });

  return (
    <main className="min-h-screen bg-[#050816] p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 shadow-2xl">
          <div className="border-b border-white/10 bg-white/5 px-7 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-400/20 p-3">
                  <Rocket className="h-6 w-6 text-cyan-300" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">
                    Advanced AI Layer
                  </p>
                  <h1 className="text-2xl font-bold">AI Innovation Suite</h1>
                </div>
              </div>

              <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
                Suite Health: {stats.score}/100
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-7 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={<Cpu />} title="Total Modules" value={stats.total} sub="Innovation systems" />
            <MetricCard icon={<CheckCircle2 />} title="Active Systems" value={stats.active} sub="Currently enabled" />
            <MetricCard icon={<Brain />} title="AI Categories" value={stats.ai} sub="AI-powered layers" />
            <MetricCard icon={<AlertTriangle />} title="Critical Modules" value={stats.critical} sub="High priority" />
          </div>

          {error && (
            <div className="mx-7 mb-6 rounded-2xl border border-red-500/40 bg-red-950/50 p-4">
              <h2 className="font-semibold text-red-100">AI Innovation Suite Warning</h2>
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <div className="border-t border-white/10 p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Innovation Control Board</h2>
                <p className="text-sm text-slate-400">
                  Marketplace AI, staff intelligence, emotion analytics, and self-healing ERP.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950 px-4 py-2">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search modules..."
                    className="bg-transparent text-sm outline-none placeholder:text-slate-500"
                  />
                </div>

                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-2 text-sm outline-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-slate-400">Loading innovation systems...</p>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {filteredModules.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-xl"
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
                          {item.category || "General"}
                        </span>
                        <h3 className="mt-3 text-lg font-bold">{item.name}</h3>
                      </div>

                      <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                        {item.status || "Active"}
                      </span>
                    </div>

                    <p className="text-sm leading-6 text-slate-300">
                      {item.description}
                    </p>

                    <div className="mt-4 rounded-2xl bg-slate-950/70 p-4">
                      <p className="text-xs uppercase tracking-wider text-slate-500">
                        Business Impact
                      </p>
                      <p className="mt-1 text-sm text-slate-200">{item.impact}</p>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-500">AI Score</p>
                        <p className="text-2xl font-bold text-cyan-200">
                          {item.score || 0}
                        </p>
                      </div>

                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                        {item.priority || "Medium"} Priority
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-5 border-t border-white/10 p-7 lg:grid-cols-3">
            <InfoPanel
              icon={<Globe2 />}
              title="Marketplace Intelligence"
              text="Agent-to-agent inventory exchange, group seats, visa slots, and hotel capacity trading."
            />
            <InfoPanel
              icon={<ShieldCheck />}
              title="Risk Protection"
              text="Refund fraud, suspicious staff behavior, duplicate vouchers, and supplier settlement risks."
            />
            <InfoPanel
              icon={<Sparkles />}
              title="Experience AI"
              text="Pilgrim emotion signals, complaint prediction, trust scoring, and satisfaction improvement."
            />
          </div>

          <div className="border-t border-white/10 p-7">
            <h2 className="mb-4 text-xl font-bold">AI Alerts</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-2xl border border-red-400/20 bg-red-950/20 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-semibold">{alert.title}</h3>
                    <span className="rounded-full bg-red-400/10 px-3 py-1 text-xs text-red-200">
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">{alert.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  icon,
  title,
  value,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
      <div className="mb-4 inline-flex rounded-2xl bg-cyan-400/10 p-3 text-cyan-200">
        {icon}
      </div>
      <p className="text-sm text-slate-400">{title}</p>
      <h2 className="mt-2 text-3xl font-black">{value}</h2>
      <p className="mt-1 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

function InfoPanel({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
      <div className="mb-3 inline-flex rounded-2xl bg-indigo-400/10 p-3 text-indigo-200">
        {icon}
      </div>
      <h3 className="font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}