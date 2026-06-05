"use client";

import { useEffect, useState } from "react";

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
};

type Option = {
  id: string;
  name?: string;
  domain?: string;
};

export default function AgentPortalsPage() {
  const [portals, setPortals] = useState<PortalRow[]>([]);
  const [themes, setThemes] = useState<Option[]>([]);
  const [domains, setDomains] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
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
  });

  async function loadData() {
    const [portalRes, themeRes, domainRes] = await Promise.all([
      fetch("/api/admin/agent-portals", { cache: "no-store" }),
      fetch("/api/admin/themes", { cache: "no-store" }),
      fetch("/api/admin/branding/domains", { cache: "no-store" }),
    ]);

    const portalJson = await portalRes.json();
    const themeJson = await themeRes.json();
    const domainJson = await domainRes.json();

    setPortals(portalJson.portals ?? []);
    setThemes(themeJson.themes ?? []);
    setDomains(domainJson.domains ?? []);
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/agent-portals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Failed");
        return;
      }

      await loadData();
      setForm({
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
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Agent Portal Separation</h1>
        <p className="mt-1 text-sm text-slate-500">
          Separate branding, access controls, modules, and portal identity for each agent.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Agent Portals</h2>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="px-3 py-3">Portal</th>
                  <th className="px-3 py-3">Slug</th>
                  <th className="px-3 py-3">Theme</th>
                  <th className="px-3 py-3">Domain</th>
                  <th className="px-3 py-3">Modules</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {portals.map((row) => (
                  <tr key={row.id} className="border-b last:border-b-0">
                    <td className="px-3 py-3 font-medium text-slate-900">{row.portal_name}</td>
                    <td className="px-3 py-3 text-slate-600">{row.portal_slug}</td>
                    <td className="px-3 py-3 text-slate-600">{row.theme_name || "-"}</td>
                    <td className="px-3 py-3 text-slate-600">{row.domain || "-"}</td>
                    <td className="px-3 py-3 text-slate-600">
                      {[
                        row.show_transport ? "Transport" : null,
                        row.show_hotels ? "Hotels" : null,
                        row.show_packages ? "Packages" : null,
                        row.show_ledger ? "Ledger" : null,
                        row.show_invoices ? "Invoices" : null,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </td>
                    <td className="px-3 py-3">
                      {row.is_active ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                          Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {portals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                      No agent portals created yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <form onSubmit={submit} className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Create Agent Portal</h2>

          <div className="mt-4 grid gap-4">
            <input
              className="rounded-2xl border px-4 py-3 outline-none"
              placeholder="Agent ID"
              value={form.agent_id}
              onChange={(e) => setForm((s) => ({ ...s, agent_id: e.target.value }))}
            />
            <input
              className="rounded-2xl border px-4 py-3 outline-none"
              placeholder="Portal name"
              value={form.portal_name}
              onChange={(e) => setForm((s) => ({ ...s, portal_name: e.target.value }))}
            />
            <input
              className="rounded-2xl border px-4 py-3 outline-none"
              placeholder="Portal slug"
              value={form.portal_slug}
              onChange={(e) => setForm((s) => ({ ...s, portal_slug: e.target.value }))}
            />

            <select
              className="rounded-2xl border px-4 py-3 outline-none"
              value={form.theme_id}
              onChange={(e) => setForm((s) => ({ ...s, theme_id: e.target.value }))}
            >
              <option value="">Select theme</option>
              {themes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <select
              className="rounded-2xl border px-4 py-3 outline-none"
              value={form.domain_id}
              onChange={(e) => setForm((s) => ({ ...s, domain_id: e.target.value }))}
            >
              <option value="">Select domain</option>
              {domains.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.domain}
                </option>
              ))}
            </select>

            <textarea
              className="min-h-[100px] rounded-2xl border px-4 py-3 outline-none"
              placeholder="Welcome text"
              value={form.welcome_text}
              onChange={(e) => setForm((s) => ({ ...s, welcome_text: e.target.value }))}
            />

            <div className="grid grid-cols-2 gap-3 rounded-2xl border p-4">
              {[
                ["show_transport", "Transport"],
                ["show_hotels", "Hotels"],
                ["show_packages", "Packages"],
                ["show_ledger", "Ledger"],
                ["show_invoices", "Invoices"],
                ["show_reports", "Reports"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={Boolean(form[key as keyof typeof form])}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, [key]: e.target.checked }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Saving..." : "Create Agent Portal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}