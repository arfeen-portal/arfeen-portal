"use client";

import { useLang } from "@/context/LanguageContext";

export default function DashboardHomePage() {
  const { t } = useLang();

  return (
    <div>
      <h1 className="text-xl font-semibold mb-2">{t("nav.dashboard")}</h1>
      <p className="text-sm text-muted-foreground">
        Welcome to your Arfeen portal dashboard.
      </p>
    </div>
  );
}
