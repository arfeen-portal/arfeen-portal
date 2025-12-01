"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type Lang = "en" | "ur" | "ar" | "tr" | "id";

type Dictionary = Record<string, string>;
type Translations = Record<Lang, Dictionary>;

const translations: Translations = {
  en: {
    "nav.dashboard": "Dashboard",
    "nav.bookings": "Bookings",
    "nav.transport": "Transport",
    "nav.locator": "Family & Driver Locator",
    "lang.english": "English",
    "lang.urdu": "Urdu",
    "lang.arabic": "Arabic",
    "lang.turkish": "Turkish",
    "lang.indonesian": "Bahasa",
  },
  ur: {
    "nav.dashboard": "ڈیش بورڈ",
    "nav.bookings": "بکنگز",
    "nav.transport": "ٹرانسپورٹ",
    "nav.locator": "فیملی اور ڈرائیور لوکیٹر",
    "lang.english": "انگلش",
    "lang.urdu": "اردو",
    "lang.arabic": "عربی",
    "lang.turkish": "ترکی",
    "lang.indonesian": "بہاسہ",
  },
  ar: {
    "nav.dashboard": "لوحة التحكم",
    "nav.bookings": "الحجوزات",
    "nav.transport": "النقل",
    "nav.locator": "متابعة العائلة والسائق",
    "lang.english": "الإنجليزية",
    "lang.urdu": "الأردية",
    "lang.arabic": "العربية",
    "lang.turkish": "التركية",
    "lang.indonesian": "الإندونيسية",
  },
  tr: {
    "nav.dashboard": "Kontrol Paneli",
    "nav.bookings": "Rezervasyonlar",
    "nav.transport": "Ulaşım",
    "nav.locator": "Aile ve Şoför Takibi",
    "lang.english": "İngilizce",
    "lang.urdu": "Urduca",
    "lang.arabic": "Arapça",
    "lang.turkish": "Türkçe",
    "lang.indonesian": "Endonezce",
  },
  id: {
    "nav.dashboard": "Dasbor",
    "nav.bookings": "Pemesanan",
    "nav.transport": "Transportasi",
    "nav.locator": "Pelacak Keluarga & Sopir",
    "lang.english": "Inggris",
    "lang.urdu": "Urdu",
    "lang.arabic": "Arab",
    "lang.turkish": "Turki",
    "lang.indonesian": "Bahasa",
  },
};

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? (window.localStorage.getItem("portal_lang") as Lang | null)
        : null;
    if (stored) setLangState(stored);
  }, []);

  function setLang(next: Lang) {
    setLangState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("portal_lang", next);
    }
  }

  function t(key: string) {
    return translations[lang][key] ?? translations.en[key] ?? key;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider");
  return ctx;
}
