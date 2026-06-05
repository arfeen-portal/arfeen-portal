"use client";

import { useEffect, useMemo, useState } from "react";

export const dynamic = "force-dynamic";

type TransportResult = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  agent_name: string | null;
  agent_code: string | null;
  pickup_city: string | null;
  dropoff_city: string | null;
  pickup_location: string | null;
  dropoff_location: string | null;
  pickup_time: string | null;
  vehicle_type: string | null;
  status: string | null;
  total_price: number | string | null;
};

type AgentResult = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  agent_code: string | null;
  is_active: boolean | null;
  status: string | null;
};

type SearchResponse = {
  ok: boolean;
  query: string;
  results: {
    transport: TransportResult[];
    agents: AgentResult[];
  };
  counts: {
    transport: number;
    agents: number;
    total: number;
  };
  error?: string;
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(value);
}

export default function GlobalSearchPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState("");

  async function runSearch(value: string) {
    const query = value.trim();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/search/global?q=${encodeURIComponent(query)}`, {
        cache: "no-store",
      });

      const json: SearchResponse = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Search failed.");
      }

      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      if (q.trim()) {
        runSearch(q);
      } else {
        setData(null);
      }
    }, 350);

    return () => clearTimeout(t);
  }, [q]);

  const totalResults = useMemo(() => data?.counts.total || 0, [data]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Global Search
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Bookings, agents aur operational records ko aik jagah se search karo.
          </p>

          <div className="mt-5 flex flex-col gap-3 md:flex-row">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Customer, phone, agent, city, route, vehicle..."
              className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900"
            />
            <button
              onClick={() => runSearch(q)}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white hover:bg-slate-800"
            >
              Search
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <div className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              Total: {totalResults}
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              Transport: {data?.counts.transport || 0}
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              Agents: {data?.counts.agents || 0}
            </div>
          </div>
        </div>

        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
            Searching...
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && q.trim() && data && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Transport Results
                </h2>
                <p className="text-sm text-slate-500">
                  Matching bookings and routes
                </p>
              </div>

              <div className="space-y-3">
                {data.results.transport.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {item.customer_name || "Unnamed Customer"}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          {item.pickup_city || "N/A"} → {item.dropoff_city || "N/A"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item.agent_name || "No agent"} • {item.vehicle_type || "Vehicle N/A"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item.customer_phone || "No phone"}
                        </div>
                      </div>

                      <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-700">
                        {item.status || "unknown"}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {item.pickup_time
                          ? new Date(item.pickup_time).toLocaleString()
                          : "No pickup time"}
                      </span>
                      <span className="font-medium text-slate-700">
                        PKR {formatMoney(Number(item.total_price || 0))}
                      </span>
                    </div>
                  </div>
                ))}

                {data.results.transport.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                    No transport results found.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Agent Results
                </h2>
                <p className="text-sm text-slate-500">
                  Matching agents and contacts
                </p>
              </div>

              <div className="space-y-3">
                {data.results.agents.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {item.name || "Unnamed Agent"}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          {item.city || "N/A"}, {item.country || "N/A"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item.email || "No email"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item.phone || "No phone"} • {item.agent_code || "No code"}
                        </div>
                      </div>

                      <div
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          item.is_active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.is_active ? "Active" : "Inactive"}
                      </div>
                    </div>
                  </div>
                ))}

                {data.results.agents.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                    No agent results found.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!loading && !error && !q.trim() && (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            Search start karne ke liye koi name, phone, city, route ya agent likhen.
          </div>
        )}
      </div>
    </div>
  );
}