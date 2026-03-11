"use client";

import { useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

const CATEGORY_OPTIONS = [
  { value: "all", label: "All" },
  { value: "bookings", label: "Bookings" },
  { value: "agents", label: "Agents" },
  { value: "vehicles", label: "Vehicles" },
];

export default function GlobalSearchPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const supabase = supabaseClient;

  const handleSearch = async () => {
    const query = q.trim();

    setLoading(true);
    setResults([]);

    try {
      if (!query) {
        setLoading(false);
        return;
      }

      // bookings
      if (category === "bookings" || category === "all") {
        const { data, error } = await supabase
          .from("bookings")
          .select("id, reference, pickup_city, dropoff_city, created_at")
          .ilike("reference", `%${query}%`)
          .limit(20);

        if (error) {
          console.error("Bookings search error:", error);
        } else {
          setResults(data ?? []);
        }
      }

      // TODO: add agents / vehicles queries here later
    } catch (error) {
      console.error("Global search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6">
      <h1 className="mb-4 text-lg font-semibold">Global Search</h1>

      <div className="mb-3 flex gap-2">
        <input
          className="flex-1 rounded border px-3 py-2"
          placeholder="Type to search..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <select
          className="rounded border px-2 py-2"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white"
          onClick={handleSearch}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <div className="rounded-xl border bg-white p-3 text-xs">
        {results.length === 0 && !loading && (
          <p className="text-gray-500 text-xs">No results</p>
        )}

        <ul className="space-y-1">
          {results.map((r) => (
            <li key={r.id} className="flex justify-between">
              <span>{r.reference}</span>
              <span className="text-gray-500">
                {r.pickup_city} → {r.dropoff_city}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}