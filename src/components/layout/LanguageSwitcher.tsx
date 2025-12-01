"use client";

import { useLang } from "@/context/LanguageContext";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useLang();

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">Lang:</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as any)}
        className="border rounded-full px-2 py-1 text-xs bg-background"
      >
        <option value="en">{t("lang.english")}</option>
        <option value="ur">{t("lang.urdu")}</option>
        <option value="ar">{t("lang.arabic")}</option>
        <option value="tr">{t("lang.turkish")}</option>
        <option value="id">{t("lang.indonesian")}</option>
      </select>
    </div>
  );
}
