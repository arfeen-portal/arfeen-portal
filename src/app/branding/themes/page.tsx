"use client";

import { useEffect, useMemo, useState } from "react";

type Theme = {
  id: string;
  name?: string | null;
  domain?: string | null;
  brand_name?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  modules?: Record<string, boolean> | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ThemeForm = {
  id: string;
  domain: string;
  brand_name: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  is_active: boolean;
};

const emptyForm: ThemeForm = {
  id: "",
  domain: "",
  brand_name: "",
  logo_url: "",
  primary_color: "#0f172a",
  secondary_color: "#d4af37",
  accent_color: "#10b981",
  is_active: true,
};

const brandingAreas = [
  "Sidebar Theme",
  "Login Background",
  "Invoice Branding",
  "Voucher Branding",
  "WhatsApp Header",
  "Public Portal Colors",
  "Agent Dashboard Theme",
  "White-label App Colors",
];

function normalizeText(value?: string | null) {
  return value?.trim() || "";
}

export default function BrandingThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [form, setForm] = useState<ThemeForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const activeTheme = useMemo(
    () => themes.find((item) => item.is_active) || themes[0] || null,
    [themes]
  );

  const stats = useMemo(
    () => [
      {
        label: "Active Theme",
        value: activeTheme?.brand_name || activeTheme?.name || "Not Set",
      },
      { label: "Tenant Themes", value: String(themes.length) },
      {
        label: "Active Records",
        value: String(themes.filter((item) => item.is_active).length),
      },
      { label: "Brand Score", value: themes.length > 0 ? "94%" : "0%" },
    ],
    [themes, activeTheme]
  );

  async function loadThemes() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/branding/themes", { cache: "no-store" });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to load themes.");
      }

      setThemes(json.themes || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load themes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadThemes();
  }, []);

  function editTheme(theme: Theme) {
    setForm({
      id: theme.id,
      domain: normalizeText(theme.domain),
      brand_name: normalizeText(theme.brand_name || theme.name),
      logo_url: normalizeText(theme.logo_url),
      primary_color: theme.primary_color || "#0f172a",
      secondary_color: theme.secondary_color || "#d4af37",
      accent_color: theme.accent_color || "#10b981",
      is_active: Boolean(theme.is_active),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setForm(emptyForm);
    setMessage("");
  }

  async function saveTheme() {
    setSaving(true);
    setMessage("");

    try {
      const method = form.id ? "PATCH" : "POST";
      const url = form.id
        ? `/api/branding/themes/${form.id}`
        : "/api/branding/themes";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: form.domain,
          brand_name: form.brand_name,
          logo_url: form.logo_url,
          primary_color: form.primary_color,
          secondary_color: form.secondary_color,
          accent_color: form.accent_color,
          is_active: form.is_active,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Unable to save theme.");
      }

      setMessage(form.id ? "Theme updated successfully." : "Theme created successfully.");
      setForm(emptyForm);
      await loadThemes();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save theme.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTheme(id: string) {
    const confirmDelete = window.confirm("Delete this theme?");
    if (!confirmDelete) return;

    setMessage("");

    try {
      const res = await fetch(`/api/branding/themes/${id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Unable to delete theme.");
      }

      setMessage("Theme deleted successfully.");
      await loadThemes();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete theme.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8">
      <section className="mx-auto max-w-7xl rounded-[32px] bg-white p-8 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-600">
              Branding Engine
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-950">
              Theme Control Center
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Tenant-wise logo, colors, login screen, invoice branding, voucher
              style and white-label identity settings manage karein.
            </p>
          </div>

          <button
            onClick={resetForm}
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            + Create Theme
          </button>
        </div>

        {message ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
            {message}
          </div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {item.label}
              </p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">
                {item.value}
              </h2>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-black text-slate-950">
              {form.id ? "Update Theme" : "Create Theme"}
            </h2>

            <div className="mt-5 space-y-3">
              <input
                placeholder="Domain e.g. arfeenportal.com"
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-200"
              />

              <input
                placeholder="Brand Name"
                value={form.brand_name}
                onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-200"
              />

              <input
                placeholder="Logo URL"
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-200"
              />

              <div className="grid grid-cols-3 gap-3">
                <label className="text-xs font-bold text-slate-500">
                  Primary
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={(e) =>
                      setForm({ ...form, primary_color: e.target.value })
                    }
                    className="mt-2 h-12 w-full rounded-xl border"
                  />
                </label>

                <label className="text-xs font-bold text-slate-500">
                  Secondary
                  <input
                    type="color"
                    value={form.secondary_color}
                    onChange={(e) =>
                      setForm({ ...form, secondary_color: e.target.value })
                    }
                    className="mt-2 h-12 w-full rounded-xl border"
                  />
                </label>

                <label className="text-xs font-bold text-slate-500">
                  Accent
                  <input
                    type="color"
                    value={form.accent_color}
                    onChange={(e) =>
                      setForm({ ...form, accent_color: e.target.value })
                    }
                    className="mt-2 h-12 w-full rounded-xl border"
                  />
                </label>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                />
                Active theme
              </label>

              <button
                onClick={saveTheme}
                disabled={saving}
                className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : form.id ? "Update Theme" : "Save Theme"}
              </button>

              {form.id ? (
                <button
                  onClick={resetForm}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700"
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>

            <div
              className="mt-6 rounded-3xl p-5 text-white"
              style={{ background: form.primary_color }}
            >
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">
                Live Preview
              </p>
              <h3 className="mt-2 text-2xl font-black">
                {form.brand_name || "Brand Name"}
              </h3>
              <p className="mt-1 text-sm opacity-80">
                {form.domain || "your-domain.com"}
              </p>
              <button
                className="mt-4 rounded-xl px-4 py-2 text-sm font-black"
                style={{
                  background: form.secondary_color,
                  color: form.primary_color,
                }}
              >
                Book Now
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 p-6">
            <h2 className="text-xl font-black text-slate-950">
              Available Themes
            </h2>

            <div className="mt-5 grid gap-4">
              {loading ? (
                <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-sm font-bold text-slate-500">
                  Loading themes...
                </div>
              ) : themes.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-sm font-bold text-slate-500">
                  No theme records found yet.
                </div>
              ) : (
                themes.map((theme) => {
                  const brandName = theme.brand_name || theme.name || "Unnamed Theme";

                  return (
                    <div
                      key={theme.id}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div
                            className="h-14 w-14 rounded-2xl border border-slate-200 bg-cover bg-center"
                            style={{
                              backgroundColor: theme.primary_color || "#0f172a",
                              backgroundImage: theme.logo_url
                                ? `url(${theme.logo_url})`
                                : undefined,
                            }}
                          />
                          <div>
                            <h3 className="text-lg font-black text-slate-900">
                              {brandName}
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                              {theme.domain || "No domain attached"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className="h-9 w-9 rounded-full border border-slate-300"
                            style={{
                              backgroundColor: theme.primary_color || "#0f172a",
                            }}
                          />
                          <span
                            className="h-9 w-9 rounded-full border border-slate-300"
                            style={{
                              backgroundColor:
                                theme.secondary_color || "#d4af37",
                            }}
                          />
                          <span
                            className="h-9 w-9 rounded-full border border-slate-300"
                            style={{
                              backgroundColor: theme.accent_color || "#10b981",
                            }}
                          />

                          <span
                            className={
                              theme.is_active
                                ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700"
                                : "rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-600"
                            }
                          >
                            {theme.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => editTheme(theme)}
                          className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteTheme(theme.id)}
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs font-black text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl bg-slate-950 p-6 text-white">
          <h2 className="text-xl font-black">AI Brand Intelligence</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Future engine logo analyze karke matching colors, gradients, invoice
            layouts, login backgrounds aur agent portal theme combinations suggest
            karega.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {brandingAreas.map((area) => (
              <div
                key={area}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-bold"
              >
                {area}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}