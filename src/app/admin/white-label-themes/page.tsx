"use client";

import { useEffect, useState } from "react";

type Theme = {
  id: string;
  domain: string;
  brand_name: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  is_active: boolean;
};

export default function WhiteLabelThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [form, setForm] = useState({
    domain: "",
    brand_name: "",
    logo_url: "",
    primary_color: "#0F3B82",
    secondary_color: "#D4AF37",
    accent_color: "#10B981",
  });

  async function load() {
    const res = await fetch("/api/admin/themes", { cache: "no-store" });
    const json = await res.json();
    if (json.ok) setThemes(json.themes || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    await fetch("/api/admin/themes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ ...form, domain: "", brand_name: "", logo_url: "" });
    await load();
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-blue-950 to-slate-900 p-8 text-white shadow-xl">
          <p className="text-sm text-yellow-300">Real White-label Engine</p>
          <h1 className="mt-2 text-3xl font-bold">Tenant-wise Theme Engine</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">
            Har agent/domain ke liye logo, colors, brand name aur theme settings manage karein.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border bg-white p-5 shadow-sm lg:col-span-1">
            <h2 className="mb-4 text-lg font-bold">Create / Update Theme</h2>
            <div className="space-y-3">
              {[
                ["domain", "Domain e.g. agent.com"],
                ["brand_name", "Brand Name"],
                ["logo_url", "Logo URL"],
              ].map(([key, label]) => (
                <input
                  key={key}
                  placeholder={label}
                  value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
              ))}

              <div className="grid grid-cols-3 gap-2">
                {["primary_color", "secondary_color", "accent_color"].map((key) => (
                  <input
                    key={key}
                    type="color"
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="h-12 w-full rounded-xl border"
                  />
                ))}
              </div>

              <button onClick={save} className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">
                Save Theme
              </button>
            </div>
          </div>

          <div className="grid gap-4 lg:col-span-2 md:grid-cols-2">
            {themes.map((t) => (
              <div key={t.id} className="rounded-3xl border bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div
                    className="h-14 w-14 rounded-2xl border bg-cover bg-center"
                    style={{ backgroundColor: t.primary_color, backgroundImage: t.logo_url ? `url(${t.logo_url})` : undefined }}
                  />
                  <div>
                    <h3 className="font-bold text-slate-900">{t.brand_name}</h3>
                    <p className="text-xs text-slate-500">{t.domain || "No domain"}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl p-4" style={{ background: t.primary_color, color: "white" }}>
                  <p className="text-xs opacity-80">Live Preview</p>
                  <h4 className="text-xl font-bold">{t.brand_name}</h4>
                  <button className="mt-3 rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: t.secondary_color }}>
                    Book Now
                  </button>
                </div>

                <div className="mt-4 flex gap-2">
                  <span className="h-8 flex-1 rounded-xl" style={{ background: t.primary_color }} />
                  <span className="h-8 flex-1 rounded-xl" style={{ background: t.secondary_color }} />
                  <span className="h-8 flex-1 rounded-xl" style={{ background: t.accent_color }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}