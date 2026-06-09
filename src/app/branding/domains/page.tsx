"use client";

import { useEffect, useState } from "react";

type ThemeOption = {
  id: string;
  name: string;
  code: string;
};

type DomainItem = {
  id: string;
  domain: string;
  host_type: "custom" | "subdomain" | "internal";
  is_primary: boolean;
  is_verified: boolean;
  ssl_status: "pending" | "active" | "failed";
  login_title: string | null;
  login_subtitle: string | null;
  theme_id: string | null;
};

export default function DomainsPage() {
  const [themes, setThemes] = useState<ThemeOption[]>([]);
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    domain: "",
    host_type: "custom",
    theme_id: "",
    login_title: "",
    login_subtitle: "",
    is_primary: false,
  });

  async function loadData() {
    const [domainsRes, themesRes] = await Promise.all([
      fetch("/api/admin/branding/domains", { cache: "no-store" }),
      fetch("/api/admin/themes", { cache: "no-store" }),
    ]);

    const domainsJson = await domainsRes.json();
    const themesJson = await themesRes.json();

    setDomains(domainsJson.domains ?? []);
    setThemes(themesJson.themes ?? []);
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function createDomain(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/branding/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Failed");
        return;
      }

      setForm({
        domain: "",
        host_type: "custom",
        theme_id: "",
        login_title: "",
        login_subtitle: "",
        is_primary: false,
      });

      await loadData();
    } finally {
      setLoading(false);
    }
  }

  async function setPrimary(id: string) {
    const res = await fetch(`/api/admin/branding/domains/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_primary: true }),
    });

    const json = await res.json();
    if (!res.ok) {
      alert(json.error || "Failed");
      return;
    }

    await loadData();
  }

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Domain-based Branding</h1>
        <p className="mt-1 text-sm text-slate-500">
          Map custom domains to themes and control white-label login presentation.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Connected Domains</h2>
          <div className="mt-4 space-y-4">
            {domains.map((item) => (
              <div key={item.id} className="rounded-2xl border p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{item.domain}</h3>
                      {item.is_primary ? (
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                          Primary
                        </span>
                      ) : null}
                      {item.is_verified ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          Verified
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.host_type} • SSL: {item.ssl_status}
                    </p>
                    {item.login_title ? (
                      <p className="mt-2 text-sm text-slate-700">{item.login_title}</p>
                    ) : null}
                  </div>

                  {!item.is_primary ? (
                    <button
                      onClick={() => void setPrimary(item.id)}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                    >
                      Set Primary
                    </button>
                  ) : null}
                </div>
              </div>
            ))}

            {domains.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">
                No domain records found yet.
              </div>
            ) : null}
          </div>
        </div>

        <form onSubmit={createDomain} className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Add Domain</h2>

          <div className="mt-4 grid gap-4">
            <input
              className="rounded-2xl border px-4 py-3 outline-none"
              placeholder="portal.yourdomain.com"
              value={form.domain}
              onChange={(e) => setForm((s) => ({ ...s, domain: e.target.value }))}
            />

            <select
              className="rounded-2xl border px-4 py-3 outline-none"
              value={form.host_type}
              onChange={(e) => setForm((s) => ({ ...s, host_type: e.target.value }))}
            >
              <option value="custom">custom</option>
              <option value="subdomain">subdomain</option>
              <option value="internal">internal</option>
            </select>

            <select
              className="rounded-2xl border px-4 py-3 outline-none"
              value={form.theme_id}
              onChange={(e) => setForm((s) => ({ ...s, theme_id: e.target.value }))}
            >
              <option value="">Select theme</option>
              {themes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </select>

            <input
              className="rounded-2xl border px-4 py-3 outline-none"
              placeholder="Login title"
              value={form.login_title}
              onChange={(e) => setForm((s) => ({ ...s, login_title: e.target.value }))}
            />

            <textarea
              className="min-h-[100px] rounded-2xl border px-4 py-3 outline-none"
              placeholder="Login subtitle"
              value={form.login_subtitle}
              onChange={(e) => setForm((s) => ({ ...s, login_subtitle: e.target.value }))}
            />

            <label className="flex items-center gap-3 rounded-2xl border px-4 py-3">
              <input
                type="checkbox"
                checked={form.is_primary}
                onChange={(e) => setForm((s) => ({ ...s, is_primary: e.target.checked }))}
              />
              <span className="text-sm text-slate-700">Set as primary domain</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Saving..." : "Create Domain"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}