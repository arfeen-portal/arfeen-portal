"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  Brain,
  Building2,
  CheckCircle2,
  Globe2,
  Paintbrush,
  Rocket,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

type Item = {
  id: string;
  agency_name: string;
  agency_type: string;
  country: string | null;
  staff_count: number;
  monthly_bookings: number;
  domain_name: string | null;
  onboarding_score: number;
  fraud_score: number;
  recommended_modules: string[];
  brand_suggestions: any;
  content_suggestions: any;
  erp_configuration: any;
  training_steps: string[];
  marketplace_requirements: any;
  ai_summary: string;
  status: string;
};

export default function AISaasOnboardingPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    agency_name: "",
    agency_type: "umrah",
    country: "Pakistan",
    staff_count: "3",
    monthly_bookings: "50",
    turnover_range: "medium",
    domain_name: "",
    uploaded_logo_url: "",
  });

  async function loadData() {
    setLoading(true);
    const res = await fetch("/api/admin/ai-saas-onboarding", { cache: "no-store" });
    const json = await res.json();
    if (json.ok) setItems(json.items || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const latest = items[0];

  const stats = useMemo(() => {
    return {
      total: items.length,
      avgOnboarding: items.length
        ? Math.round(items.reduce((s, i) => s + Number(i.onboarding_score || 0), 0) / items.length)
        : 0,
      highRisk: items.filter((i) => Number(i.fraud_score || 0) >= 70).length,
      activeAI: 20,
    };
  }, [items]);

  async function generateAI() {
    setSaving(true);

    const res = await fetch("/api/admin/ai-saas-onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await res.json();

    if (!json.ok) {
      alert(json.error || "AI generation failed.");
      setSaving(false);
      return;
    }

    await loadData();
    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/20 via-slate-900 to-slate-950 p-6 shadow-2xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-indigo-300">
                AI White Label SaaS
              </p>
              <h1 className="mt-2 text-3xl font-black">AI SaaS Onboarding Command Center</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300">
                AI tenant setup, brand generator, content generator, module recommendation,
                onboarding progress, DNS assistant, fraud detection, ERP configurator,
                training system aur autonomous travel operating suggestions.
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-300/20 bg-black/30 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-indigo-200">
                <Bot size={18} />
                20 AI Engines Active
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Stat icon={<Building2 />} label="AI Setups" value={stats.total} />
          <Stat icon={<CheckCircle2 />} label="Avg Setup %" value={`${stats.avgOnboarding}%`} />
          <Stat icon={<ShieldAlert />} label="High Risk" value={stats.highRisk} />
          <Stat icon={<Brain />} label="AI Engines" value={stats.activeAI} />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <h2 className="text-xl font-bold">Generate AI Setup</h2>
            <p className="mt-1 text-sm text-slate-400">
              Agency details do, AI complete setup recommendation generate karega.
            </p>

            <div className="mt-5 space-y-4">
              <Input label="Agency Name" value={form.agency_name} onChange={(v) => setForm({ ...form, agency_name: v })} />
              <Input label="Agency Type" value={form.agency_type} onChange={(v) => setForm({ ...form, agency_type: v })} />
              <Input label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
              <Input label="Staff Count" value={form.staff_count} onChange={(v) => setForm({ ...form, staff_count: v })} />
              <Input label="Monthly Bookings" value={form.monthly_bookings} onChange={(v) => setForm({ ...form, monthly_bookings: v })} />
              <Input label="Turnover Range" value={form.turnover_range} onChange={(v) => setForm({ ...form, turnover_range: v })} />
              <Input label="Domain Name" value={form.domain_name} onChange={(v) => setForm({ ...form, domain_name: v })} />
              <Input label="Logo URL" value={form.uploaded_logo_url} onChange={(v) => setForm({ ...form, uploaded_logo_url: v })} />

              <button
                onClick={generateAI}
                disabled={saving || !form.agency_name}
                className="w-full rounded-xl bg-indigo-500 px-4 py-3 font-black text-white hover:bg-indigo-400 disabled:opacity-50"
              >
                {saving ? "Generating AI..." : "Generate AI Configuration"}
              </button>
            </div>
          </div>

          <div className="space-y-6 lg:col-span-2">
            {latest ? (
              <>
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black">{latest.agency_name}</h2>
                      <p className="mt-1 text-sm text-slate-400">{latest.ai_summary}</p>
                    </div>
                    <Rocket className="text-indigo-300" />
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <ScoreCard label="Onboarding Progress" value={latest.onboarding_score} />
                    <ScoreCard label="Fraud Probability" value={latest.fraud_score} danger />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <Panel title="AI Recommended Modules" icon={<Sparkles />}>
                    <div className="flex flex-wrap gap-2">
                      {(latest.recommended_modules || []).map((m) => (
                        <span key={m} className="rounded-full bg-indigo-400/10 px-3 py-1 text-xs font-bold text-indigo-200">
                          {m}
                        </span>
                      ))}
                    </div>
                  </Panel>

                  <Panel title="AI Brand Generator" icon={<Paintbrush />}>
                    <Info label="Theme" value={latest.brand_suggestions?.theme} />
                    <Info label="Primary Color" value={latest.brand_suggestions?.primary_color} />
                    <Info label="Invoice Design" value={latest.brand_suggestions?.invoice_design} />
                    <Info label="Login Background" value={latest.brand_suggestions?.login_background} />
                  </Panel>

                  <Panel title="AI Website Content" icon={<Globe2 />}>
                    <Info label="SEO Title" value={latest.content_suggestions?.seo_title} />
                    <Info label="WhatsApp Intro" value={latest.content_suggestions?.whatsapp_intro} />
                    <Info label="Invoice Footer" value={latest.content_suggestions?.invoice_footer} />
                  </Panel>

                  <Panel title="AI ERP Configurator" icon={<Brain />}>
                    <Info label="Invoice Numbering" value={latest.erp_configuration?.invoice_numbering} />
                    <Info label="Voucher Types" value={(latest.erp_configuration?.voucher_types || []).join(", ")} />
                    <Info label="Approval Flows" value={(latest.erp_configuration?.approval_flows || []).join(", ")} />
                  </Panel>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
                  <h2 className="text-xl font-bold">AI Onboarding Progress Engine</h2>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {(latest.training_steps || []).map((step, index) => (
                      <div key={step} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900 p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-400/10 text-sm font-black text-indigo-300">
                          {index + 1}
                        </div>
                        <div className="text-sm font-semibold text-slate-200">{step}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center text-slate-400">
                {loading ? "Loading AI setups..." : "Abhi koi AI setup generate nahi hua."}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: any }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">{label}</div>
        <div className="text-indigo-300">{icon}</div>
      </div>
      <div className="mt-3 text-3xl font-black">{value}</div>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-300">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-3 text-sm outline-none focus:border-indigo-400"
      />
    </div>
  );
}

function ScoreCard({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">{label}</span>
        <span className={danger ? "text-rose-300" : "text-emerald-300"}>{value}%</span>
      </div>
      <div className="mt-3 h-3 rounded-full bg-white/10">
        <div
          className={`h-3 rounded-full ${danger ? "bg-rose-400" : "bg-emerald-400"}`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold">{title}</h3>
        <div className="text-indigo-300">{icon}</div>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl bg-slate-900 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-200">{value || "Not generated"}</div>
    </div>
  );
}