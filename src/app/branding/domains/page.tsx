"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Eye,
  Globe2,
  Lock,
  RefreshCcw,
  Search,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";

import type { DomainStatus, HostType, SslStatus } from "@/types/branding";

type ThemeOption = {
  id: string;
  name?: string | null;
  brand_name?: string | null;
  domain?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  logo_url?: string | null;
};

type DomainItem = {
  id: string;
  domain: string;
  host_type?: HostType | string | null;
  status?: DomainStatus | string | null;
  auto_detect?: boolean | null;
  is_primary?: boolean | null;
  is_verified?: boolean | null;
  ssl_status?: SslStatus | string | null;
  login_title?: string | null;
  login_subtitle?: string | null;
  theme_id?: string | null;
  created_at?: string | null;
};

const emptyForm = {
  domain: "",
  host_type: "custom" as HostType,
  status: "active" as DomainStatus,
  auto_detect: true,
  theme_id: "",
  login_title: "",
  login_subtitle: "",
  is_primary: false,
};

function cleanDomain(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

function isValidDomain(value: string) {
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value);
}

function getThemeName(theme?: ThemeOption) {
  return theme?.brand_name || theme?.name || theme?.domain || "Selected Theme";
}

export default function DomainsPage() {
  const [themes, setThemes] = useState<ThemeOption[]>([]);
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DomainItem | null>(null);
  const [dnsModalOpen, setDnsModalOpen] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<ThemeOption | null>(null);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const selectedTheme = themes.find((t) => t.id === form.theme_id) || null;

  const filteredDomains = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return domains;

    return domains.filter((d) =>
      [
        d.domain,
        d.status,
        d.host_type,
        d.ssl_status,
        d.login_title,
        d.login_subtitle,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [domains, query]);

  const stats = useMemo(() => {
    return {
      total: domains.length,
      active: domains.filter((d) => (d.status || "active") === "active").length,
      verified: domains.filter((d) => Boolean(d.is_verified)).length,
      primary: domains.filter((d) => Boolean(d.is_primary)).length,
    };
  }, [domains]);

  async function loadData() {
    setLoading(true);
    setMessage(null);

    try {
      const [domainsRes, themesRes] = await Promise.all([
        fetch("/api/branding/domains", { cache: "no-store" }),
        fetch("/api/branding/themes", { cache: "no-store" }),
      ]);

      const domainsJson = await domainsRes.json();
      const themesJson = await themesRes.json();

      if (!domainsRes.ok || domainsJson.ok === false) {
        throw new Error(domainsJson.error || "Domains load failed.");
      }

      if (!themesRes.ok || themesJson.ok === false) {
        throw new Error(themesJson.error || "Themes load failed.");
      }

      setDomains(domainsJson.domains || domainsJson.items || []);
      setThemes(themesJson.themes || themesJson.items || []);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Domains ya themes load nahi ho sake.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function copyUrl(domain: string, id: string) {
    await navigator.clipboard.writeText(`https://${domain}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1300);
  }

  async function createDomain(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    const domain = cleanDomain(form.domain);

    if (!isValidDomain(domain)) {
      setMessage({
        type: "error",
        text: "Valid domain add karo. Example: arfeenportal.com",
      });
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/branding/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, domain }),
      });

      const json = await res.json();

      if (!res.ok || json.ok === false) {
        setMessage({
          type: "error",
          text: json.error || "Domain create nahi hua.",
        });
        return;
      }

      setDnsModalOpen(true);
      setForm(emptyForm);
      setMessage({
        type: "success",
        text: "Domain mapping created. DNS instructions follow karo.",
      });

      await loadData();
    } catch {
      setMessage({
        type: "error",
        text: "Domain save karte waqt error aaya.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function setPrimary(id: string) {
    setMessage(null);

    try {
      const res = await fetch(`/api/branding/domains/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_primary: true }),
      });

      const json = await res.json();

      if (!res.ok || json.ok === false) {
        setMessage({
          type: "error",
          text: json.error || "Primary domain set nahi hua.",
        });
        return;
      }

      setMessage({ type: "success", text: "Primary domain updated." });
      await loadData();
    } catch {
      setMessage({ type: "error", text: "Primary domain update failed." });
    }
  }

  async function retrySsl(id: string) {
    setMessage(null);

    try {
      const res = await fetch(`/api/branding/domains/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "retry_ssl" }),
      });

      const json = await res.json();

      if (!res.ok || json.ok === false) {
        setMessage({
          type: "error",
          text: json.error || "SSL retry failed.",
        });
        return;
      }

      setMessage({
        type: "success",
        text: "SSL check queued. Status pending ho gaya.",
      });

      await loadData();
    } catch {
      setMessage({ type: "error", text: "SSL retry failed." });
    }
  }

  async function deleteDomain() {
    if (!deleteTarget) return;

    try {
      const res = await fetch(`/api/branding/domains/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok || json.ok === false) {
        setMessage({
          type: "error",
          text: json.error || "Domain delete nahi hua.",
        });
        return;
      }

      setMessage({ type: "success", text: "Domain mapping deleted." });
      setDeleteTarget(null);
      await loadData();
    } catch {
      setMessage({ type: "error", text: "Domain delete failed." });
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">
                Domain Intelligence
              </p>
              <h1 className="mt-3 text-3xl font-black text-slate-950">
                Domain-based Branding
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                Custom domains ko tenant, theme, login screen, SSL status aur
                middleware auto-detection ke sath map karo.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
              Middleware Ready
            </div>
          </div>

          {message ? (
            <div
              className={[
                "mt-6 rounded-2xl border px-4 py-3 text-sm font-bold",
                message.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700",
              ].join(" ")}
            >
              {message.text}
            </div>
          ) : null}

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <Stat label="Connected Domains" value={stats.total} />
            <Stat label="Active Domains" value={stats.active} />
            <Stat label="Verified Domains" value={stats.verified} />
            <Stat label="Primary Domains" value={stats.primary} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black text-slate-950">
                Connected Domains
              </h2>

              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search domain..."
                  className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {loading ? (
                <SkeletonList />
              ) : filteredDomains.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-sm font-bold text-slate-500">
                  No domain records found.
                </div>
              ) : (
                filteredDomains.map((item) => {
                  const sslStatus = item.ssl_status || "pending";
                  const theme = themes.find((t) => t.id === item.theme_id);

                  return (
                    <div
                      key={item.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black text-slate-900">
                              {item.domain}
                            </h3>

                            {item.is_primary ? <Badge tone="blue">Primary</Badge> : null}

                            {item.is_verified ? (
                              <Badge tone="emerald">Verified</Badge>
                            ) : (
                              <Badge tone="amber">Pending DNS</Badge>
                            )}

                            <Badge
                              tone={
                                (item.status || "active") === "active"
                                  ? "emerald"
                                  : (item.status || "") === "blocked"
                                    ? "red"
                                    : "slate"
                              }
                            >
                              {item.status || "active"}
                            </Badge>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                            <span>Type: {item.host_type || "custom"}</span>
                            <SslIndicator status={sslStatus} />
                            <span>
                              Auto Detect: {item.auto_detect === false ? "No" : "Yes"}
                            </span>
                          </div>

                          <p className="mt-2 text-xs font-bold text-slate-400">
                            Theme: {getThemeName(theme)}
                          </p>

                          {item.login_title ? (
                            <p className="mt-3 text-sm font-bold text-slate-700">
                              {item.login_title}
                            </p>
                          ) : null}

                          {item.login_subtitle ? (
                            <p className="mt-1 text-sm text-slate-500">
                              {item.login_subtitle}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {!item.is_primary ? (
                            <button
                              onClick={() => void setPrimary(item.id)}
                              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white"
                            >
                              Set Primary
                            </button>
                          ) : null}

                          {(sslStatus === "pending" || sslStatus === "failed") && (
                            <button
                              type="button"
                              onClick={() => void retrySsl(item.id)}
                              className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-black text-amber-700"
                            >
                              <RefreshCcw size={15} />
                              Retry SSL
                            </button>
                          )}

                          {theme ? (
                            <button
                              type="button"
                              onClick={() => setPreviewTheme(theme)}
                              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-black text-blue-700"
                            >
                              <Eye size={15} />
                              Preview
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => void copyUrl(item.domain, item.id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700"
                          >
                            <Copy size={15} />
                            {copiedId === item.id ? "Copied!" : "Copy URL"}
                          </button>

                          <button
                            type="button"
                            disabled={Boolean(item.is_primary)}
                            onClick={() => setDeleteTarget(item)}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-black text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                            title={
                              item.is_primary
                                ? "Primary domain delete nahi ho sakta."
                                : "Delete domain"
                            }
                          >
                            <Trash2 size={15} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <form
            onSubmit={createDomain}
            className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl"
          >
            <h2 className="text-xl font-black text-slate-950">Add Domain</h2>

            <div className="mt-5 grid gap-4">
              <input
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="portal.yourdomain.com"
                value={form.domain}
                onChange={(e) =>
                  setForm((s) => ({ ...s, domain: e.target.value }))
                }
              />

              <select
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                value={form.host_type}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    host_type: e.target.value as HostType,
                  }))
                }
              >
                <option value="custom">Custom Domain</option>
                <option value="subdomain">Subdomain</option>
                <option value="internal">Internal / Local</option>
              </select>

              <select
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                value={form.status}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    status: e.target.value as DomainStatus,
                  }))
                }
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="paused">Paused</option>
                <option value="blocked">Blocked</option>
              </select>

              <div className="grid gap-2">
                <select
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  value={form.theme_id}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, theme_id: e.target.value }))
                  }
                >
                  <option value="">Select theme</option>
                  {themes.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                      {getThemeName(theme)}
                    </option>
                  ))}
                </select>

                {selectedTheme ? (
                  <button
                    type="button"
                    onClick={() => setPreviewTheme(selectedTheme)}
                    className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-black text-blue-700"
                  >
                    Preview Theme
                  </button>
                ) : null}
              </div>

              <input
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Login title"
                value={form.login_title}
                onChange={(e) =>
                  setForm((s) => ({ ...s, login_title: e.target.value }))
                }
              />

              <textarea
                className="min-h-[100px] rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Login subtitle"
                value={form.login_subtitle}
                onChange={(e) =>
                  setForm((s) => ({ ...s, login_subtitle: e.target.value }))
                }
              />

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.auto_detect}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, auto_detect: e.target.checked }))
                  }
                />
                Enable middleware auto-detection
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_primary}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, is_primary: e.target.checked }))
                  }
                />
                Set as primary domain
              </label>

              <div className="rounded-3xl bg-slate-950 p-5 text-white">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-300">
                  Live Preview
                </p>
                <h3 className="mt-3 text-2xl font-black">
                  {form.login_title || "White-label Login"}
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  {form.login_subtitle ||
                    "Domain-specific login screen preview yahan show hoga."}
                </p>
                <p className="mt-4 break-all rounded-2xl bg-white/10 p-3 text-xs text-slate-300">
                  https://{cleanDomain(form.domain) || "your-domain.com"}
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Domain Mapping"}
              </button>
            </div>
          </form>
        </div>
      </section>

      {dnsModalOpen ? (
        <Modal title="DNS Setup Instructions" onClose={() => setDnsModalOpen(false)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Registrar/Cloudflare mein ye DNS record add karo:
            </p>

            <DnsRow label="Type" value="CNAME" />
            <DnsRow label="Name" value="@ or portal" />
            <DnsRow label="Target" value="cname.vercel-dns.com" />
            <DnsRow label="TTL" value="Auto" />

            <p className="rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-700">
              DNS update ke baad propagation 5 minutes se 24 hours tak le sakti hai.
            </p>
          </div>
        </Modal>
      ) : null}

      {previewTheme ? (
        <Modal title="Theme Preview" onClose={() => setPreviewTheme(null)}>
          <ThemePreview theme={previewTheme} domain={cleanDomain(form.domain)} />
        </Modal>
      ) : null}

      {deleteTarget ? (
        <Modal title="Delete Domain Mapping" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <div className="rounded-3xl bg-red-50 p-5 text-red-700">
              <div className="flex items-center gap-2 font-black">
                <ShieldAlert size={18} />
                Confirm delete
              </div>
              <p className="mt-2 text-sm">
                `{deleteTarget.domain}` ko delete karne se us domain ki branding
                mapping remove ho jayegi.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => void deleteDomain()}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white"
              >
                Delete Mapping
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </main>
  );
}

function SslIndicator({ status }: { status: string }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
        <Lock size={15} />
        SSL Active
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 font-bold text-red-600">
        <AlertTriangle size={15} />
        SSL Failed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 font-bold text-amber-600">
      <AlertTriangle size={15} />
      SSL Pending
    </span>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-3xl border border-slate-200 bg-slate-50 p-5"
        >
          <div className="h-5 w-52 rounded bg-slate-200" />
          <div className="mt-4 h-4 w-80 rounded bg-slate-200" />
          <div className="mt-5 flex gap-3">
            <div className="h-10 w-28 rounded-xl bg-slate-200" />
            <div className="h-10 w-28 rounded-xl bg-slate-200" />
            <div className="h-10 w-28 rounded-xl bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ThemePreview({
  theme,
  domain,
}: {
  theme: ThemeOption;
  domain?: string;
}) {
  const primary = theme.primary_color || "#0f172a";
  const secondary = theme.secondary_color || "#d4af37";
  const accent = theme.accent_color || "#10b981";

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
          Mobile Preview
        </p>
        <div
          className="mx-auto min-h-[420px] max-w-[240px] rounded-[32px] border-8 border-slate-900 p-4 text-white"
          style={{ background: primary }}
        >
          <div className="h-16 w-16 rounded-2xl bg-white/20 bg-cover bg-center" />
          <h3 className="mt-5 text-xl font-black">{getThemeName(theme)}</h3>
          <p className="mt-2 text-xs opacity-80">
            {domain || "your-domain.com"}
          </p>
          <button
            className="mt-6 rounded-xl px-4 py-2 text-sm font-black"
            style={{ background: secondary, color: primary }}
          >
            Login
          </button>
        </div>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
          Desktop Preview
        </p>
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="p-5 text-white" style={{ background: primary }}>
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black">{getThemeName(theme)}</h3>
              <span
                className="rounded-full px-3 py-1 text-xs font-black"
                style={{ background: accent }}
              >
                Live
              </span>
            </div>
            <p className="mt-2 text-sm opacity-80">
              White-label domain experience preview.
            </p>
          </div>
          <div className="grid gap-3 p-5">
            <div className="h-4 w-3/4 rounded bg-slate-200" />
            <div className="h-4 w-1/2 rounded bg-slate-200" />
            <button
              className="mt-3 w-fit rounded-xl px-4 py-2 text-sm font-black"
              style={{ background: secondary, color: primary }}
            >
              Start Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DnsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <span className="text-sm font-bold text-slate-500">{label}</span>
      <span className="font-mono text-sm font-black text-slate-900">{value}</span>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[32px] bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl font-black text-slate-950">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-600"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <h2 className="mt-3 text-3xl font-black text-slate-950">{value}</h2>
    </div>
  );
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "blue" | "emerald" | "amber" | "red" | "slate";
}) {
  const classes = {
    blue: "bg-blue-100 text-blue-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    slate: "bg-slate-200 text-slate-700",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-black ${classes[tone]}`}>
      {children}
    </span>
  );
}