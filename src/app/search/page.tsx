"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

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

  const supabase = createClient();

  const handleSearch = async () => {
    setLoading(true);
    setResults([]);

    // Simple example – aap apni purani global search ka code yahan shift kar sakte ho
    if (category === "bookings" || category === "all") {
      const { data } = await supabase
        .from("bookings")
        .select("id, reference, pickup_city, dropoff_city, created_at")
        .ilike("reference", `%${q}%`)
        .limit(20);
      setResults(data || []);
    }

    // TODO: add agents / vehicles etc similarly

    setLoading(false);
  };

  return (
    <main className="p-6">
      <h1 className="text-lg font-semibold mb-4">Global Search</h1>
      <div className="flex gap-2 mb-3">
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="Type to search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="border rounded px-2 py-2"
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
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm"
          onClick={handleSearch}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <div className="border rounded-xl p-3 bg-white text-xs">
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
