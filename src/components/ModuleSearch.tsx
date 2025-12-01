"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type ModuleDef = {
  label: string;
  href: string;
  keywords: string[];
};

const MODULES: ModuleDef[] = [
  {
    label: "Transport Bookings",
    href: "/transport/book",
    keywords: ["transport", "booking", "makkah", "madinah", "rides"],
  },
  {
    label: "Transport Routes",
    href: "/transport/routes",
    keywords: ["routes", "route", "jed", "airport"],
  },
  {
    label: "Umrah Packages",
    href: "/umrah/packages",
    keywords: ["umrah", "package", "pkg"],
  },
  {
    label: "Group Ticketing",
    href: "/group-ticketing",
    keywords: ["group", "ticket", "airline", "batch"],
  },
  {
    label: "Calculator Rules",
    href: "/calculator/rules",
    keywords: ["calculator", "price", "rule"],
  },
  {
    label: "Hotels",
    href: "/hotels",
    keywords: ["hotel", "makkah hotel", "madinah hotel"],
  },
];

export default function ModuleSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const q = query.trim().toLowerCase();
    if (!q) return;

    const match =
      MODULES.find((m) =>
        m.keywords.some((k) => k.toLowerCase().includes(q) || q.includes(k))
      ) ||
      MODULES.find((m) => m.label.toLowerCase().includes(q));

    if (!match) {
      setError("No module matched.");
      return;
    }

    router.push(match.href);
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-1 text-sm"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search module (e.g. transport, umrah)…"
          className="border rounded-l-full px-3 py-1 text-sm w-56"
        />
        <button
          type="submit"
          className="border border-l-0 rounded-r-full px-3 py-1 bg-white hover:bg-gray-50"
        >
          Go
        </button>
      </form>
      {error && (
        <div className="text-[11px] text-red-600 -mt-1">{error}</div>
      )}
    </div>
  );
}
