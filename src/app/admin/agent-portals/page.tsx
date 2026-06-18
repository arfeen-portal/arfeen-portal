"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Copy,
  Globe2,
  LayoutDashboard,
  Loader2,
  MonitorSmartphone,
  Rocket,
  ShieldCheck,
  Sparkles,
  Wand2,
  XCircle,
} from "lucide-react";

type PortalRow = {
  id: string;
  agent_id: string;
  portal_name: string;
  portal_slug: string;
  theme_name: string | null;
  domain: string | null;
  is_active: boolean;
  show_transport: boolean;
  show_hotels: boolean;
  show_packages: boolean;
  show_ledger: boolean;
  show_invoices: boolean;
  show_reports?: boolean;
};

type Option = {
  id: string;
  name?: string;
  domain?: string;
};

type FormState = {
  agent_id: string;
  portal_name: string;
  portal_slug: string;
  theme_id: string;
  domain_id: string;
  show_transport: boolean;
  show_hotels: boolean;
  show_packages: boolean;
  show_ledger: boolean;
  show_invoices: boolean;
  show_reports: boolean;
  can_view_only_own_data: boolean;
  can_book_transport: boolean;
  can_book_hotels: boolean;
  can_book_packages: boolean;
  support_phone: string;
  support_whatsapp: string;
  welcome_text: string;
};

const initialForm: FormState = {
  agent_id: "",
  portal_name: "",
  portal_slug: "",
  theme_id: "",
  domain_id: "",
  show_transport: true,
  show_hotels: true,
  show_packages: true,
  show_ledger: true,
  show_invoices: true,
  show_reports: false,
  can_view_only_own_data: true,
  can_book_transport: true,
  can_book_hotels: true,
  can_book_packages: true,
  support_phone: "",
  support_whatsapp: "",
  welcome_text: "",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AgentPortalsPage() {
  const [portals, setPortals] = useState<PortalRow[]>([]);
  const [themes, setThemes] = useState<Option[]>([]);
  const [domains, setDomains] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const [form, setForm] = useState<FormState>(initialForm);

  const selectedTheme = themes.find((item) => item.id === form.theme_id);
  const selectedDomain = domains.find((item) => item.id === form.domain_id);

  const generatedUrl = selectedDomain?.domain
    ? `https://${selectedDomain.domain}/${form.portal_slug || "agent"}`
    : `https://your-domain.com/${form.portal_slug || "agent"}`;

  const stats = useMemo(() => {
    return {
      total: portals.length,
      active: portals.filter((p) => p.is_active).length,
      domains: portals.filter((p) => Boolean(p.domain)).length,
      modules: portals.reduce((sum, p) => {
        return (
          sum +
          [
            p.show_transport,
            p.show_hotels,
            p.show_packages,
            p.show_ledger,
            p.show_invoices,
            p.show_reports,
          ].filter(Boolean).length
        );
      }, 0),
    };
  }, [portals]);

  const readiness = useMemo(() => {
    const checks = [
      Boolean(form.agent_id.trim()),
      Boolean(form.portal_name.trim()),
      Boolean(form.portal_slug.trim()),
      Boolean(form.theme_id),
      Boolean(form.domain_id),
      Boolean(form.welcome_text.trim()),
      [
        form.show_transport,
        form.show_hotels,
        form.show_packages,
        form.show_ledger,
        form.show_invoices,
        form.show_reports,
      ].some(Boolean),
      form.can_view_only_own_data,
    ];

    const passed = checks.filter(Boolean).length;
    return Math.round((passed / checks.length) * 100);
  }, [form]);

  async function loadData() {
    setPageLoading(true);
    setMessage(null);

    try {
      const [portalRes, themeRes, domainRes] = await Promise.all([
        fetch("/api/admin/agent-portals", { cache: "no-store" }),
        fetch("/api/admin/themes", { cache: "no-store" }),
        fetch("/api/branding/domains", { cache: "no-store" }),
      ]);

      const portalJson = await portalRes.json();
      const themeJson = await themeRes.json();
      const domainJson = await domainRes.json();

      setPortals(portalJson.portals ?? []);
      setThemes(themeJson.themes ?? []);
      setDomains(domainJson.domains ?? []);
    } catch {
      setMessage({
        type: "error",
        text: "Agent portals, themes ya domains load nahi ho sake.",
      });
    } finally {
      setPageLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  function updateField(key: keyof FormState, value: string | boolean) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "portal_name" && !prev.portal_slug) {
        next.portal_slug = slugify(String(value));
      }

      return next;
    });

    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validateForm() {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.agent_id.trim()) nextErrors.agent_id = "Agent ID required hai.";
    if (!form.portal_name.trim()) nextErrors.portal_name = "Portal name required hai.";
    if (!form.portal_slug.trim()) nextErrors.portal_slug = "Portal slug required hai.";
    if (!form.theme_id) nextErrors.theme_id = "Theme select karo.";
    if (!form.domain_id) nextErrors.domain_id = "Domain select karo.";
    if (!form.welcome_text.trim()) nextErrors.welcome_text = "Welcome text add karo.";

    const hasAnyModule = [
      form.show_transport,
      form.show_hotels,
      form.show_packages,
      form.show_ledger,
      form.show_invoices,
      form.show_reports,
    ].some(Boolean);

    if (!hasAnyModule) {
      nextErrors.show_transport = "Kam az kam aik module select karo.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function applySmartSuggestion() {
    setForm((prev) => ({
      ...prev,
      show_transport: true,
      show_hotels: true,
      show_packages: true,
      show_ledger: true,
      show_invoices: true,
      show_reports: false,
      can_view_only_own_data: true,
      can_book_transport: true,
      can_book_hotels: true,
      can_book_packages: true,
      welcome_text:
        prev.welcome_text ||
        "Welcome to your smart travel portal. Book transport, hotels and packages from one secure panel.",
    }));

    setMessage({ type: "success", text: "Smart module suggestion apply ho gayi." });
  }

  function cloneMasterTemplate() {
    setForm((prev) => ({
      ...prev,
      portal_name: prev.portal_name || "Arfeen Smart Agent Portal",
      portal_slug: prev.portal_slug || "arfeen-smart-agent",
      show_transport: true,
      show_hotels: true,
      show_packages: true,
      show_ledger: true,
      show_invoices: true,
      show_reports: true,
      can_view_only_own_data: true,
      can_book_transport: true,
      can_book_hotels: true,
      can_book_packages: true,
      welcome_text:
        "Your white-label travel portal is ready. Manage bookings, ledger and services from one branded dashboard.",
    }));

    setMessage({
      type: "success",
      text: "Master template cloned. Ab agent/domain details confirm karo.",
    });
  }

  async function copyText(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setMessage({ type: "error", text: "Copy failed. Browser permission check karo." });
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!validateForm()) {
      setMessage({ type: "error", text: "Form errors fix karo." });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/agent-portals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: json.error || "Agent portal create nahi hua." });
        return;
      }

      setMessage({
        type: "success",
        text: "Agent portal created. Domain, theme aur modules attach ho gaye.",
      });

      await loadData();
      setForm(initialForm);
      setErrors({});
    } catch {
      setMessage({ type: "error", text: "Agent portal save karte waqt error aaya." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/15 via-slate-900 to-slate-950 p-6 shadow-2xl">
          <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.25em] text-cyan-300">
            <Sparkles size={16} />
            Smart White-Label Agent Portal
          </p>
          <h1 className="mt-3 text-3xl font-black md:text-4xl">
            Agent Portal Separation
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Separate branding, domain, modules, launch readiness, mobile web-app link aur data guardrails.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={applySmartSuggestion}
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-sm font-bold text-cyan-200"
            >
              <Wand2 size={16} />
              Smart Suggest
            </button>

            <button
              type="button"
              onClick={cloneMasterTemplate}
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-bold text-amber-200"
            >
              <Copy size={16} />
              Clone Template
            </button>
          </div>
        </section>

        {message ? (
          <div
            className={[
              "rounded-2xl border px-4 py-3 text-sm font-semibold",
              message.type === "success"
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                : "border-rose-400/30 bg-rose-400/10 text-rose-200",
            ].join(" ")}
          >
            {message.text}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-4">
          <StatCard icon={<LayoutDashboard />} label="Total Portals" value={stats.total} />
          <StatCard icon={<CheckCircle2 />} label="Active Portals" value={stats.active} />
          <StatCard icon={<Globe2 />} label="Mapped Domains" value={stats.domains} />
          <StatCard icon={<Activity />} label="Enabled Modules" value={stats.modules} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">Agent Portals</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Domain health, modules aur active status.
                </p>
              </div>
              {pageLoading ? <Loader2 className="animate-spin text-cyan-300" /> : null}
            </div>

            <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10">
              <table className="min-w-[950px] w-full text-sm">
                <thead className="bg-white/5 text-left text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Portal</th>
                    <th className="px-4 py-3">Theme</th>
                    <th className="px-4 py-3">Domain Health</th>
                    <th className="px-4 py-3">Modules</th>
                    <th className="px-4 py-3">Mobile Link</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {pageLoading
                    ? Array.from({ length: 4 }).map((_, index) => (
                        <SkeletonRow key={index} />
                      ))
                    : portals.map((row) => {
                        const url = row.domain
                          ? `https://${row.domain}/${row.portal_slug}`
                          : `https://your-domain.com/${row.portal_slug}`;

                        return (
                          <tr key={row.id} className="bg-slate-950/40">
                            <td className="px-4 py-4">
                              <div className="font-bold text-white">{row.portal_name}</div>
                              <div className="text-xs text-slate-400">
                                /{row.portal_slug} · Agent {row.agent_id}
                              </div>
                            </td>

                            <td className="px-4 py-4 text-slate-300">
                              {row.theme_name || "No theme"}
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <span
                                  className={[
                                    "h-2.5 w-2.5 rounded-full",
                                    row.domain ? "bg-emerald-400" : "bg-amber-400",
                                  ].join(" ")}
                                />
                                <div>
                                  <div className="text-slate-200">{row.domain || "No domain"}</div>
                                  <div className="text-xs text-slate-500">
                                    {row.domain ? "Mapped / SSL check pending" : "Mapping required"}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex max-w-sm flex-wrap gap-1.5">
                                {[
                                  row.show_transport ? "Transport" : null,
                                  row.show_hotels ? "Hotels" : null,
                                  row.show_packages ? "Packages" : null,
                                  row.show_ledger ? "Ledger" : null,
                                  row.show_invoices ? "Invoices" : null,
                                  row.show_reports ? "Reports" : null,
                                ]
                                  .filter(Boolean)
                                  .map((item) => (
                                    <span
                                      key={String(item)}
                                      className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-200"
                                    >
                                      {item}
                                    </span>
                                  ))}
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <button
                                type="button"
                                onClick={() => copyText(url, row.id)}
                                className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10"
                              >
                                <MonitorSmartphone size={14} />
                                {copied === row.id ? "Copied" : "Copy Link"}
                              </button>
                            </td>

                            <td className="px-4 py-4">
                              {row.is_active ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                                  <CheckCircle2 size={14} />
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-400/10 px-3 py-1 text-xs font-bold text-rose-300">
                                  <XCircle size={14} />
                                  Inactive
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                  {!pageLoading && portals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                        No agent portals created yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <form
            onSubmit={submit}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">Create Agent Portal</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Domain, theme, modules aur guardrails attach karo.
                </p>
              </div>
              <Rocket className="text-cyan-300" />
            </div>

            <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-cyan-200">Portal Readiness Score</p>
                <p className="text-2xl font-black text-white">{readiness}%</p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-800">
                <div
                  className="h-2 rounded-full bg-cyan-400"
                  style={{ width: `${readiness}%` }}
                />
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <Input
                placeholder="Agent ID"
                value={form.agent_id}
                error={errors.agent_id}
                onChange={(v) => updateField("agent_id", v)}
              />

              <Input
                placeholder="Portal name"
                value={form.portal_name}
                error={errors.portal_name}
                onChange={(v) => updateField("portal_name", v)}
              />

              <Input
                placeholder="Portal slug"
                value={form.portal_slug}
                error={errors.portal_slug}
                onChange={(v) => updateField("portal_slug", slugify(v))}
              />

              <FieldError error={errors.theme_id}>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                  value={form.theme_id}
                  onChange={(e) => updateField("theme_id", e.target.value)}
                >
                  <option value="">Select theme</option>
                  {themes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </FieldError>

              <FieldError error={errors.domain_id}>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                  value={form.domain_id}
                  onChange={(e) => updateField("domain_id", e.target.value)}
                >
                  <option value="">Select domain</option>
                  {domains.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.domain}
                    </option>
                  ))}
                </select>
              </FieldError>

              <FieldError error={errors.welcome_text}>
                <textarea
                  className="min-h-[100px] w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                  placeholder="Welcome text"
                  value={form.welcome_text}
                  onChange={(e) => updateField("welcome_text", e.target.value)}
                />
              </FieldError>

              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-200">
                  <ShieldCheck size={16} className="text-cyan-300" />
                  Modules & Data Guardrails
                </div>

                {errors.show_transport ? (
                  <p className="mb-3 text-xs text-rose-400">{errors.show_transport}</p>
                ) : null}

                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["show_transport", "Transport"],
                    ["show_hotels", "Hotels"],
                    ["show_packages", "Packages"],
                    ["show_ledger", "Ledger"],
                    ["show_invoices", "Invoices"],
                    ["show_reports", "Reports"],
                    ["can_view_only_own_data", "Own Data Only"],
                    ["can_book_transport", "Book Transport"],
                    ["can_book_hotels", "Book Hotels"],
                    ["can_book_packages", "Book Packages"],
                  ].map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(form[key as keyof FormState])}
                        onChange={(e) => updateField(key as keyof FormState, e.target.checked)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                <p className="mb-3 text-sm font-bold text-cyan-200">Live Preview</p>

                <div className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.25em] text-cyan-300">
                        {selectedTheme?.name || "Selected Theme"}
                      </div>
                      <div className="mt-1 text-lg font-black">
                        {form.portal_name || "Agent Portal"}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyText(generatedUrl, "preview-url")}
                      className="rounded-xl bg-cyan-400 px-3 py-2 text-xs font-black text-slate-950"
                    >
                      {copied === "preview-url" ? "Copied" : "Copy URL"}
                    </button>
                  </div>

                  <p className="mt-4 text-sm text-slate-400">
                    {form.welcome_text || "Agent welcome message yahan preview hoga."}
                  </p>

                  <div className="mt-4 break-all text-xs text-slate-500">
                    {generatedUrl}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Creating Portal..." : "Create Smart Agent Portal"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="bg-slate-950/40">
      {Array.from({ length: 6 }).map((_, index) => (
        <td key={index} className="px-4 py-4">
          <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
          <div className="mt-2 h-3 w-20 animate-pulse rounded bg-white/5" />
        </td>
      ))}
    </tr>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <div className="text-cyan-300">{icon}</div>
      </div>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  error?: string;
}) {
  return (
    <div>
      <input
        className={[
          "w-full rounded-2xl border bg-slate-900 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500",
          error
            ? "border-rose-400 focus:border-rose-400"
            : "border-white/10 focus:border-cyan-400",
        ].join(" ")}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? <p className="mt-1 text-xs text-rose-400">{error}</p> : null}
    </div>
  );
}

function FieldError({
  children,
  error,
}: {
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      {children}
      {error ? <p className="mt-1 text-xs text-rose-400">{error}</p> : null}
    </div>
  );
}