"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";

type SearchItem = {
  entity_type: string;
  entity_id: string;
  title: string;
  subtitle: string;
  meta: string;
  href: string;
};

export default function GlobalSearchPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const term = q.trim();

    if (!term) {
      setResults([]);
      setError("");
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/search/global?q=${encodeURIComponent(term)}&limit=20`, {
          cache: "no-store",
          signal: controller.signal,
        });

        const json = await res.json();

        if (!json.success) {
          throw new Error(json.error || "Failed to search");
        }

        setResults(json.data || []);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Search failed");
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [q]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Global Search</h1>
        <p className="mt-1 text-sm text-slate-500">
          Search bookings, agents and operational records from one place.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search customer, phone, city, agent, booking, route..."
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none ring-0 focus:border-slate-900"
        />
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Searching...</div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-3">
        {results.map((item) => (
          <Link
            key={`${item.entity_type}-${item.entity_id}`}
            href={item.href}
            className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-slate-900">{item.title}</div>
                <div className="mt-1 text-sm text-slate-600">{item.subtitle}</div>
                <div className="mt-2 text-xs uppercase tracking-wide text-slate-400">
                  {item.entity_type}
                </div>
              </div>
            </div>
            <div className="mt-3 text-sm text-slate-500">{item.meta}</div>
          </Link>
        ))}

        {!loading && q.trim() && results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No results found.
          </div>
        ) : null}
      </div>
    </div>
  );
}