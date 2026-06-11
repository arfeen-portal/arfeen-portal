"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, type Transition } from "framer-motion";

type AnimationSettings = {
  button_hover: "scale" | "lift" | "glow" | "none";
  card_reveal: "fadeUp" | "scaleIn" | "slideLeft" | "none";
  page_transition: "fade" | "slideRight" | "scale" | "none";
  navbar_style: "solid" | "glass" | "gradient";
};

type UiSettings = {
  glass_opacity: number;
  shadow_style: "none" | "soft" | "deep" | "glow";
  gradient_style: "none" | "premium" | "sunset" | "ocean" | "royal";
  layout_density: "compact" | "comfortable" | "spacious";
  animation_speed: "slow" | "normal" | "fast";
};

type Theme = {
  id: string;
  name: string;
  code: string;
  is_default: boolean;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  header_bg: string;
  sidebar_bg: string;
  card_bg: string;
  text_color: string;
  muted_text_color: string;
  border_color: string;
  font_family: string;
  border_radius: string;
  is_active: boolean;
  animation_settings?: AnimationSettings | null;
  ui_settings?: UiSettings | null;
};

type ThemeForm = {
  name: string;
  code: string;
  is_default: boolean;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  header_bg: string;
  sidebar_bg: string;
  card_bg: string;
  text_color: string;
  muted_text_color: string;
  border_color: string;
  font_family: string;
  border_radius: string;
  animation_settings: AnimationSettings;
  ui_settings: UiSettings;
};

const defaultAnimations: AnimationSettings = {
  button_hover: "scale",
  card_reveal: "fadeUp",
  page_transition: "slideRight",
  navbar_style: "glass",
};

const defaultUi: UiSettings = {
  glass_opacity: 0.72,
  shadow_style: "soft",
  gradient_style: "premium",
  layout_density: "comfortable",
  animation_speed: "normal",
};

const initialForm: ThemeForm = {
  name: "",
  code: "",
  is_default: false,
  primary_color: "#2563eb",
  secondary_color: "#0f172a",
  accent_color: "#f59e0b",
  header_bg: "#ffffff",
  sidebar_bg: "#0f172a",
  card_bg: "#ffffff",
  text_color: "#111827",
  muted_text_color: "#6b7280",
  border_color: "#e5e7eb",
  font_family: "Inter",
  border_radius: "18px",
  animation_settings: defaultAnimations,
  ui_settings: defaultUi,
};

const presets: Record<string, ThemeForm> = {
  modernSaas: {
    ...initialForm,
    name: "Modern SaaS",
    code: "modern-saas",
    primary_color: "#2563eb",
    secondary_color: "#0f172a",
    accent_color: "#38bdf8",
  },
  corporate: {
    ...initialForm,
    name: "Corporate",
    code: "corporate",
    primary_color: "#1e3a8a",
    secondary_color: "#111827",
    accent_color: "#d97706",
    border_radius: "12px",
    animation_settings: {
      button_hover: "lift",
      card_reveal: "fadeUp",
      page_transition: "fade",
      navbar_style: "solid",
    },
  },
  luxuryUmrah: {
    ...initialForm,
    name: "Luxury Umrah",
    code: "luxury-umrah",
    primary_color: "#065f46",
    secondary_color: "#022c22",
    accent_color: "#d4af37",
    header_bg: "#fbf7ef",
    sidebar_bg: "#022c22",
    card_bg: "#fffaf0",
    border_color: "#e7d8b8",
    border_radius: "24px",
    animation_settings: {
      button_hover: "glow",
      card_reveal: "scaleIn",
      page_transition: "scale",
      navbar_style: "glass",
    },
    ui_settings: {
      glass_opacity: 0.68,
      shadow_style: "glow",
      gradient_style: "royal",
      layout_density: "spacious",
      animation_speed: "slow",
    },
  },
  playful: {
    ...initialForm,
    name: "Playful",
    code: "playful",
    primary_color: "#7c3aed",
    secondary_color: "#312e81",
    accent_color: "#f97316",
    border_radius: "28px",
    animation_settings: {
      button_hover: "scale",
      card_reveal: "slideLeft",
      page_transition: "slideRight",
      navbar_style: "gradient",
    },
    ui_settings: {
      glass_opacity: 0.74,
      shadow_style: "deep",
      gradient_style: "sunset",
      layout_density: "comfortable",
      animation_speed: "normal",
    },
  },
};

function getTransitionDuration(speed: UiSettings["animation_speed"]) {
  if (speed === "slow") return 0.75;
  if (speed === "fast") return 0.25;
  return 0.45;
}

function getPageMotion(
  type: AnimationSettings["page_transition"],
  speed: UiSettings["animation_speed"]
): {
  initial: Record<string, number>;
  animate: Record<string, number>;
  transition: Transition;
} {
  const duration = getTransitionDuration(speed);

  if (type === "slideRight") {
    return {
      initial: { opacity: 0, x: -22 },
      animate: { opacity: 1, x: 0 },
      transition: { duration, ease: [0.4, 0, 0.2, 1] },
    };
  }

  if (type === "scale") {
    return {
      initial: { opacity: 0, scale: 0.96 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration, ease: [0.16, 1, 0.3, 1] },
    };
  }

  if (type === "none") {
    return {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      transition: { duration: 0 },
    };
  }

  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration, ease: [0.4, 0, 0.2, 1] },
  };
}

function gradientBackground(style: UiSettings["gradient_style"]) {
  if (style === "sunset") return "linear-gradient(135deg, #fff7ed, #fed7aa, #fb7185)";
  if (style === "ocean") return "linear-gradient(135deg, #ecfeff, #bae6fd, #2563eb)";
  if (style === "royal") return "linear-gradient(135deg, #022c22, #065f46, #d4af37)";
  if (style === "premium") return "linear-gradient(135deg, #f8fafc, #e0f2fe, #dbeafe)";
  return "#f8fafc";
}

function shadowValue(style: UiSettings["shadow_style"]) {
  if (style === "deep") return "0 24px 70px rgba(15, 23, 42, 0.22)";
  if (style === "glow") return "0 22px 70px rgba(37, 99, 235, 0.28)";
  if (style === "soft") return "0 18px 45px rgba(15, 23, 42, 0.10)";
  return "none";
}

export default function AdminThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [form, setForm] = useState<ThemeForm>(initialForm);
  const [loading, setLoading] = useState(false);

  const motionProps = getPageMotion(
    form.animation_settings.page_transition,
    form.ui_settings.animation_speed
  );

  const cssVars = useMemo(
    () =>
      ({
        "--primary-color": form.primary_color,
        "--secondary-color": form.secondary_color,
        "--accent-color": form.accent_color,
        "--header-bg": form.header_bg,
        "--sidebar-bg": form.sidebar_bg,
        "--card-bg": form.card_bg,
        "--text-color": form.text_color,
        "--muted-text-color": form.muted_text_color,
        "--border-color": form.border_color,
        "--radius": form.border_radius,
      }) as React.CSSProperties,
    [form]
  );

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

  function updateAnimation<K extends keyof AnimationSettings>(
    key: K,
    value: AnimationSettings[K]
  ) {
    setForm((s) => ({
      ...s,
      animation_settings: {
        ...s.animation_settings,
        [key]: value,
      },
    }));
  }

  function updateUi<K extends keyof UiSettings>(key: K, value: UiSettings[K]) {
    setForm((s) => ({
      ...s,
      ui_settings: {
        ...s.ui_settings,
        [key]: value,
      },
    }));
  }

  return (
    <div className="space-y-6 p-6" style={cssVars}>
      <motion.div
        initial={motionProps.initial}
        animate={motionProps.animate}
        transition={motionProps.transition}
        className="rounded-3xl border bg-white p-6 shadow-sm"
        style={{
          borderColor: "var(--border-color)",
          borderRadius: "var(--radius)",
        }}
      >
        <h1 className="text-2xl font-bold text-slate-900">Theme Marketplace</h1>
        <p className="mt-1 text-sm text-slate-500">
          Multi-theme colors, glass UI, animations, presets, and live preview.
        </p>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">System Theme Sync</h2>
            <p className="mt-1 text-sm text-slate-500">
              Default theme public API se load hogi aur RootLayout mein CSS variables inject honge.
            </p>

            <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
              <div>API: /api/public/theme</div>
              <div>Root Sync: &lt;ThemeStyleSync /&gt;</div>
              <div>CSS: --primary-color, --accent-color, --radius, --glass-opacity</div>
            </div>
          </div>

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Presets</h2>

            <div className="mt-4 grid gap-3 md:grid-cols-4">
              {Object.entries(presets).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm(preset)}
                  className="rounded-2xl border p-4 text-left transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="font-semibold text-slate-900">{preset.name}</div>
                  <div className="mt-2 flex gap-2">
                    <span className="h-6 w-6 rounded-full border" style={{ background: preset.primary_color }} />
                    <span className="h-6 w-6 rounded-full border" style={{ background: preset.secondary_color }} />
                    <span className="h-6 w-6 rounded-full border" style={{ background: preset.accent_color }} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={onSubmit} className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Create Theme</h2>

            <div className="mt-4 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
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
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {[
                  ["Primary", "primary_color"],
                  ["Secondary", "secondary_color"],
                  ["Accent", "accent_color"],
                  ["Header", "header_bg"],
                  ["Sidebar", "sidebar_bg"],
                  ["Card", "card_bg"],
                  ["Text", "text_color"],
                  ["Muted Text", "muted_text_color"],
                  ["Border", "border_color"],
                ].map(([label, key]) => (
                  <label key={key} className="space-y-2 text-sm">
                    <span className="text-slate-600">{label}</span>
                    <input
                      type="color"
                      className="h-12 w-full rounded-xl border p-2"
                      value={String(form[key as keyof ThemeForm])}
                      onChange={(e) =>
                        setForm((s) => ({
                          ...s,
                          [key]: e.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="text-slate-600">Font Family</span>
                  <input
                    className="w-full rounded-2xl border px-4 py-3 outline-none"
                    value={form.font_family}
                    onChange={(e) => setForm((s) => ({ ...s, font_family: e.target.value }))}
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="text-slate-600">Border Radius</span>
                  <input
                    className="w-full rounded-2xl border px-4 py-3 outline-none"
                    value={form.border_radius}
                    onChange={(e) => setForm((s) => ({ ...s, border_radius: e.target.value }))}
                  />
                </label>
              </div>

              <div className="rounded-3xl border bg-slate-50 p-5">
                <h3 className="font-semibold text-slate-900">Animation Engine</h3>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="text-slate-600">Button Hover</span>
                    <select
                      className="w-full rounded-2xl border px-4 py-3"
                      value={form.animation_settings.button_hover}
                      onChange={(e) =>
                        updateAnimation("button_hover", e.target.value as AnimationSettings["button_hover"])
                      }
                    >
                      <option value="scale">Scale</option>
                      <option value="lift">Lift</option>
                      <option value="glow">Glow</option>
                      <option value="none">None</option>
                    </select>
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="text-slate-600">Card Reveal</span>
                    <select
                      className="w-full rounded-2xl border px-4 py-3"
                      value={form.animation_settings.card_reveal}
                      onChange={(e) =>
                        updateAnimation("card_reveal", e.target.value as AnimationSettings["card_reveal"])
                      }
                    >
                      <option value="fadeUp">Fade Up</option>
                      <option value="scaleIn">Scale In</option>
                      <option value="slideLeft">Slide Left</option>
                      <option value="none">None</option>
                    </select>
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="text-slate-600">Page Transition</span>
                    <select
                      className="w-full rounded-2xl border px-4 py-3"
                      value={form.animation_settings.page_transition}
                      onChange={(e) =>
                        updateAnimation("page_transition", e.target.value as AnimationSettings["page_transition"])
                      }
                    >
                      <option value="fade">Fade</option>
                      <option value="slideRight">Slide Right</option>
                      <option value="scale">Scale</option>
                      <option value="none">None</option>
                    </select>
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="text-slate-600">Navbar Style</span>
                    <select
                      className="w-full rounded-2xl border px-4 py-3"
                      value={form.animation_settings.navbar_style}
                      onChange={(e) =>
                        updateAnimation("navbar_style", e.target.value as AnimationSettings["navbar_style"])
                      }
                    >
                      <option value="solid">Solid</option>
                      <option value="glass">Glass</option>
                      <option value="gradient">Gradient</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="rounded-3xl border bg-slate-50 p-5">
                <h3 className="font-semibold text-slate-900">UI Settings</h3>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="text-slate-600">
                      Glass Opacity: {form.ui_settings.glass_opacity}
                    </span>
                    <input
                      type="range"
                      min="0.35"
                      max="1"
                      step="0.01"
                      className="w-full"
                      value={form.ui_settings.glass_opacity}
                      onChange={(e) => updateUi("glass_opacity", Number(e.target.value))}
                    />
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="text-slate-600">Shadow Style</span>
                    <select
                      className="w-full rounded-2xl border px-4 py-3"
                      value={form.ui_settings.shadow_style}
                      onChange={(e) => updateUi("shadow_style", e.target.value as UiSettings["shadow_style"])}
                    >
                      <option value="none">None</option>
                      <option value="soft">Soft</option>
                      <option value="deep">Deep</option>
                      <option value="glow">Glow</option>
                    </select>
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="text-slate-600">Gradient</span>
                    <select
                      className="w-full rounded-2xl border px-4 py-3"
                      value={form.ui_settings.gradient_style}
                      onChange={(e) => updateUi("gradient_style", e.target.value as UiSettings["gradient_style"])}
                    >
                      <option value="none">None</option>
                      <option value="premium">Premium</option>
                      <option value="sunset">Sunset</option>
                      <option value="ocean">Ocean</option>
                      <option value="royal">Royal</option>
                    </select>
                  </label>

                  <label className="space-y-2 text-sm">
                    <span className="text-slate-600">Animation Speed</span>
                    <select
                      className="w-full rounded-2xl border px-4 py-3"
                      value={form.ui_settings.animation_speed}
                      onChange={(e) => updateUi("animation_speed", e.target.value as UiSettings["animation_speed"])}
                    >
                      <option value="slow">Slow</option>
                      <option value="normal">Normal</option>
                      <option value="fast">Fast</option>
                    </select>
                  </label>
                </div>
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

          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Saved Themes</h2>

            <div className="mt-4 space-y-4">
              {themes.map((theme) => (
                <div key={theme.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
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

                      <p className="mt-1 text-sm text-slate-500">Code: {theme.code}</p>

                      <div className="mt-3 flex gap-2">
                        <span className="h-7 w-7 rounded-full border" style={{ background: theme.primary_color }} />
                        <span className="h-7 w-7 rounded-full border" style={{ background: theme.secondary_color }} />
                        <span className="h-7 w-7 rounded-full border" style={{ background: theme.accent_color }} />
                      </div>
                    </div>

                    {!theme.is_default ? (
                      <button
                        type="button"
                        onClick={() => void makeDefault(theme.id)}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                      >
                        Set Default
                      </button>
                    ) : null}
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
        </div>

        <div className="sticky top-6 h-fit rounded-[2rem] border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Live Mobile Preview</h2>

          <div
            className="mt-4 overflow-hidden rounded-[2rem] border p-4"
            style={{
              background: gradientBackground(form.ui_settings.gradient_style),
              borderColor: form.border_color,
            }}
          >
            <motion.div
              initial={motionProps.initial}
              animate={motionProps.animate}
              transition={motionProps.transition}
              className="mx-auto min-h-[620px] max-w-[320px] overflow-hidden rounded-[2rem] border"
              style={{
                background: form.card_bg,
                borderColor: form.border_color,
                boxShadow: shadowValue(form.ui_settings.shadow_style),
              }}
            >
              <div
                className="p-4"
                style={{
                  background:
                    form.animation_settings.navbar_style === "gradient"
                      ? `linear-gradient(135deg, ${form.primary_color}, ${form.accent_color})`
                      : form.animation_settings.navbar_style === "glass"
                        ? `rgba(255,255,255,${form.ui_settings.glass_opacity})`
                        : form.header_bg,
                  backdropFilter:
                    form.animation_settings.navbar_style === "glass" ? "blur(18px)" : "none",
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold" style={{ color: form.text_color }}>
                      Arfeen Portal
                    </div>
                    <div className="text-xs" style={{ color: form.muted_text_color }}>
                      Premium Travel OS
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-2xl" style={{ background: form.primary_color }} />
                </div>
              </div>

              <div className="space-y-4 p-4">
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: getTransitionDuration(form.ui_settings.animation_speed),
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  className="rounded-3xl p-5"
                  style={{
                    background: form.primary_color,
                    borderRadius: form.border_radius,
                    color: "#ffffff",
                  }}
                >
                  <div className="text-xs opacity-80">Today Sales</div>
                  <div className="mt-2 text-3xl font-bold">SAR 24,850</div>
                  <div className="mt-2 text-xs opacity-80">+18% from yesterday</div>
                </motion.div>

                {["Umrah Groups", "Transport", "Hotels"].map((item, index) => (
                  <motion.div
                    key={item}
                    initial={
                      form.animation_settings.card_reveal === "scaleIn"
                        ? { opacity: 0, scale: 0.94 }
                        : form.animation_settings.card_reveal === "slideLeft"
                          ? { opacity: 0, x: 30 }
                          : { opacity: 0, y: 18 }
                    }
                    animate={
                      form.animation_settings.card_reveal === "scaleIn"
                        ? { opacity: 1, scale: 1 }
                        : form.animation_settings.card_reveal === "slideLeft"
                          ? { opacity: 1, x: 0 }
                          : { opacity: 1, y: 0 }
                    }
                    transition={{
                      duration: getTransitionDuration(form.ui_settings.animation_speed),
                      delay: index * 0.08,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    className="rounded-3xl border p-4"
                    style={{
                      borderColor: form.border_color,
                      borderRadius: form.border_radius,
                      background: form.card_bg,
                    }}
                  >
                    <div className="font-semibold" style={{ color: form.text_color }}>
                      {item}
                    </div>
                    <div className="mt-1 text-xs" style={{ color: form.muted_text_color }}>
                      Live module preview
                    </div>
                  </motion.div>
                ))}

                <motion.button
                  whileHover={
                    form.animation_settings.button_hover === "scale"
                      ? { scale: 1.05 }
                      : form.animation_settings.button_hover === "lift"
                        ? { y: -4 }
                        : form.animation_settings.button_hover === "glow"
                          ? { scale: 1.02, boxShadow: `0 0 30px ${form.accent_color}` }
                          : {}
                  }
                  className="w-full rounded-2xl px-4 py-3 text-sm font-bold text-white"
                  style={{
                    background: form.accent_color,
                    borderRadius: form.border_radius,
                  }}
                >
                  Book Now
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}