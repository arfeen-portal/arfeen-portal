"use client";

import { useEffect, useState } from "react";

type PublicTheme = {
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
  animation_settings?: Record<string, unknown>;
  ui_settings?: {
    glass_opacity?: number;
    shadow_style?: string;
    gradient_style?: string;
    layout_density?: string;
    animation_speed?: string;
  };
};

const fallbackTheme: PublicTheme = {
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
};

function buildCss(theme: PublicTheme) {
  const glassOpacity = theme.ui_settings?.glass_opacity ?? 0.72;

  return `
    :root {
      --primary-color: ${theme.primary_color};
      --secondary-color: ${theme.secondary_color};
      --accent-color: ${theme.accent_color};
      --header-bg: ${theme.header_bg};
      --sidebar-bg: ${theme.sidebar_bg};
      --card-bg: ${theme.card_bg};
      --text-color: ${theme.text_color};
      --muted-text-color: ${theme.muted_text_color};
      --border-color: ${theme.border_color};
      --radius: ${theme.border_radius};
      --theme-font: ${theme.font_family};
      --glass-opacity: ${glassOpacity};
    }

    body {
      color: var(--text-color);
      font-family: var(--theme-font), Inter, system-ui, sans-serif;
    }

    .theme-card {
      background: var(--card-bg);
      border-color: var(--border-color);
      border-radius: var(--radius);
    }

    .theme-primary {
      background: var(--primary-color);
      color: white;
    }

    .theme-accent {
      background: var(--accent-color);
      color: white;
    }

    .theme-glass {
      background: rgba(255, 255, 255, var(--glass-opacity));
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      border-color: var(--border-color);
    }
  `;
}

export default function ThemeStyleSync() {
  const [css, setCss] = useState(buildCss(fallbackTheme));

  useEffect(() => {
    let mounted = true;

    async function loadTheme() {
      try {
        const res = await fetch("/api/public/theme", { cache: "no-store" });
        const json = await res.json();

        if (!mounted) return;

        setCss(buildCss(json.theme ?? fallbackTheme));
      } catch {
        if (!mounted) return;
        setCss(buildCss(fallbackTheme));
      }
    }

    void loadTheme();

    return () => {
      mounted = false;
    };
  }, []);

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}