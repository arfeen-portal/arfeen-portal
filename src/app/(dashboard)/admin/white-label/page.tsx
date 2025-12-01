"use client";

import { useEffect, useState } from "react";

type Tenant = {
  id: string;
  name: string;
  domain: string;
  primary_color: string | null;
  accent_color: string | null;
  logo_url: string | null;
  is_active: boolean;
  modules: Record<string, boolean>;
};

export default function WhiteLabelPage() {
  const [items, setItems] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<Tenant>>({
    name: "",
    domain: "",
    primary_color: "#003b88",
    accent_color: "#f5b400",
    is_active: true,
    modules: {
      transport: true,
      hotels: true,
      flights: true,
      locator: true,
      accounts: true,
    },
  });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/white-label");
    const json = await res.json();
    setItems(json.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createTenant() {
    const res = await fetch("/api/white-label", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) return alert("Error creating tenant");
    await load();
  }

  async function toggleActive(id: string, is_active: boolean) {
    const res = await fetch(`/api/white-label/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active }),
    });
    if (!res.ok) return alert("Error updating tenant");
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">White-label automation</h1>
        <p className="text-sm text-muted-foreground">
          Create sub-portals for each agent with custom domain, colors and
          enabled modules.
        </p>
      </div>

      {/* CREATE FORM */}
      <div className="border rounded-2xl p-4 space-y-3">
        <div className="font-medium text-sm">Create new tenant</div>
        <div className="grid gap-3 md:grid-cols-3 text-sm">
          <input
            placeholder="Brand name"
            className="border rounded-md px-2 py-1"
            value={form.name ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            placeholder="portal.agent-domain.com"
            className="border rounded-md px-2 py-1"
            value={form.domain ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, domain: e.target.value }))
            }
          />
          <input
            placeholder="Logo URL"
            className="border rounded-md px-2 py-1"
            value={form.logo_url ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, logo_url: e.target.value }))
            }
          />
          <label className="flex items-center gap-2">
            <span className="w-24">Primary</span>
            <input
              type="color"
              value={form.primary_color ?? "#003b88"}
              onChange={(e) =>
                setForm((f) => ({ ...f, primary_color: e.target.value }))
              }
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="w-24">Accent</span>
            <input
              type="color"
              value={form.accent_color ?? "#f5b400"}
              onChange={(e) =>
                setForm((f) => ({ ...f, accent_color: e.target.value }))
              }
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-3 text-xs">
          {["transport", "hotels", "flights", "locator", "accounts"].map(
            (key) => (
              <label key={key} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={form.modules?.[key] ?? false}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      modules: {
                        ...(f.modules ?? {}),
                        [key]: e.target.checked,
                      },
                    }))
                  }
                />
                {key}
              </label>
            )
          )}
        </div>

        <button
          onClick={createTenant}
          className="px-4 py-1.5 rounded-full border text-sm"
        >
          Create tenant
        </button>
      </div>

      {/* LIST */}
      <div className="border rounded-2xl overflow-hidden">
        <div className="px-4 py-2 border-b flex justify-between text-sm">
          <span>Tenants</span>
          {loading && <span className="text-muted-foreground">Loading…</span>}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-3 py-2 text-left">Brand</th>
              <th className="px-3 py-2 text-left">Domain</th>
              <th className="px-3 py-2 text-left">Modules</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {t.logo_url && (
                      <img
                        src={t.logo_url}
                        alt={t.name}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    )}
                    <span>{t.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2">{t.domain}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(t.modules ?? {})
                      .filter(([, v]) => v)
                      .map(([k]) => (
                        <span
                          key={k}
                          className="px-2 py-0.5 rounded-full border text-[11px]"
                        >
                          {k}
                        </span>
                      ))}
                  </div>
                </td>
                <td className="px-3 py-2">
                  {t.is_active ? (
                    <span className="text-green-600 text-xs">Active</span>
                  ) : (
                    <span className="text-red-600 text-xs">Disabled</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    className="text-xs underline"
                    onClick={() => toggleActive(t.id, !t.is_active)}
                  >
                    {t.is_active ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-4 text-center text-xs text-muted-foreground"
                >
                  No tenants created yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
