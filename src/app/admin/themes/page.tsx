"use client";

import { useEffect, useState } from "react";

type Theme = {
  id: string;
  name: string;
  code: string;
  is_default: boolean;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_family: string;
  border_radius: string;
  is_active: boolean;
};

const initialForm = {
  name: "",
  code: "",
  is_default: false,
  primary_color: "#1d4ed8",
  secondary_color: "#0f172a",
  accent_color: "#f59e0b",
  header_bg: "#ffffff",
  sidebar_bg: "#0f172a",
  card_bg: "#ffffff",
  text_color: "#111827",
  muted_text_color: "#6b7280",
  border_color: "#e5e7eb",
  font_family: "Inter",
  border_radius: "16px",
};

export default function AdminThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  async function loadThemes() {
    const res = await fetch("/api/admin/themes", { cache: "no-store" });
    const json = await res.json();
    setThemes(json.themes ?? []);
  }

  useEffect(() => {
    void loadThemes();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Failed to create theme");
        return;
      }

      setForm(initialForm);
      await loadThemes();
    } finally {
      setLoading(false);
    }
  }

  async function makeDefault(id: string) {
    const res = await fetch(`/api/admin/themes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_default: true }),
    });

    const json = await res.json();
    if (!res.ok) {
      alert(json.error || "Failed to update theme");
      return;
    }

    await loadThemes();
  }

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Theme System</h1>
            <p className="mt-1 text-sm text-slate-500">
              White-label themes, colors, branding assets, and UI identity management.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Saved Themes</h2>
          <div className="mt-4 space-y-4">
            {themes.map((theme) => (
              <div
                key={theme.id}
                className="rounded-2xl border border-slate-200 p-4 transition hover:shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{theme.name}</h3>
                      {theme.is_default ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          Default
                        </span>
                      ) : null}
                      {!theme.is_active ? (
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                          Inactive
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-slate-500">Code: {theme.code}</p>
                    <div className="flex gap-2">
                      <span className="h-7 w-7 rounded-full border" style={{ background: theme.primary_color }} />
                      <span className="h-7 w-7 rounded-full border" style={{ background: theme.secondary_color }} />
                      <span className="h-7 w-7 rounded-full border" style={{ background: theme.accent_color }} />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!theme.is_default ? (
                      <button
                        onClick={() => void makeDefault(theme.id)}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                      >
                        Set Default
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}

            {themes.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-slate-500">
                No themes found yet.
              </div>
            ) : null}
          </div>
        </div>

        <form onSubmit={onSubmit} className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Create Theme</h2>

          <div className="mt-4 grid gap-4">
            <input
              className="rounded-2xl border px-4 py-3 outline-none"
              placeholder="Theme name"
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            />
            <input
              className="rounded-2xl border px-4 py-3 outline-none"
              placeholder="Theme code"
              value={form.code}
              onChange={(e) => setForm((s) => ({ ...s, code: e.target.value }))}
            />

            <div className="grid grid-cols-2 gap-4">
              <label className="space-y-2 text-sm">
                <span className="text-slate-600">Primary</span>
                <input
                  type="color"
                  className="h-12 w-full rounded-xl border p-2"
                  value={form.primary_color}
                  onChange={(e) => setForm((s) => ({ ...s, primary_color: e.target.value }))}
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="text-slate-600">Secondary</span>
                <input
                  type="color"
                  className="h-12 w-full rounded-xl border p-2"
                  value={form.secondary_color}
                  onChange={(e) => setForm((s) => ({ ...s, secondary_color: e.target.value }))}
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="text-slate-600">Accent</span>
                <input
                  type="color"
                  className="h-12 w-full rounded-xl border p-2"
                  value={form.accent_color}
                  onChange={(e) => setForm((s) => ({ ...s, accent_color: e.target.value }))}
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="text-slate-600">Radius</span>
                <input
                  className="w-full rounded-2xl border px-4 py-3 outline-none"
                  value={form.border_radius}
                  onChange={(e) => setForm((s) => ({ ...s, border_radius: e.target.value }))}
                />
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border px-4 py-3">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(e) => setForm((s) => ({ ...s, is_default: e.target.checked }))}
              />
              <span className="text-sm text-slate-700">Make default theme</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Saving..." : "Create Theme"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}