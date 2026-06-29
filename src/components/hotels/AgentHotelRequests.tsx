"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BedDouble, FileText, Hotel, LogIn, Plus, RefreshCw } from "lucide-react";

type Demand = {
  id: string;
  guest_name: string;
  city: string;
  hotel: string;
  check_in: string;
  check_out: string;
  nights: number;
  room_type: string;
  status: string;
  final_selling_rate: number;
  expected_market_price: number;
  hcn: string | null;
  hcn_status: string;
};

const statusBadge: Record<string, string> = {
  new: "bg-slate-100 text-slate-700",
  rfq_pending: "bg-amber-100 text-amber-800",
  quoted: "bg-blue-100 text-blue-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
};

type AgentHotelRequestsProps = {
  isAuthenticated: boolean;
  isAgent: boolean;
};

export default function AgentHotelRequests({
  isAuthenticated,
  isAgent,
}: AgentHotelRequestsProps) {
  const [data, setData] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(isAuthenticated);
  const [error, setError] = useState("");

  async function loadData() {
    if (!isAuthenticated) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/hotel-demands", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to load requests");
      }
      setData(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load requests");
      setData([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  const stats = useMemo(
    () => ({
      total: data.length,
      quoted: data.filter((item) => item.status === "quoted").length,
      confirmed: data.filter((item) => item.status === "confirmed").length,
    }),
    [data]
  );

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-50 md:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-300">
            Hotel Requests
          </p>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
            My Hotel Requests & Quotations
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
            Submit offline hotel requests and track quotations, confirmations,
            vouchers, and HCN status for your own bookings.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/hotels/offline-demands/new"
              className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300"
            >
              <Plus className="h-4 w-4" />
              New Hotel Request
            </Link>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={loadData}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            ) : (
              <Link
                href="/login?next=/hotels/offline-demands"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                <LogIn className="h-4 w-4" />
                Login to View Requests
              </Link>
            )}

            {isAgent ? (
              <Link
                href="/agent/hotels"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-5 py-2.5 text-sm font-semibold text-emerald-200 hover:bg-emerald-400/20"
              >
                <BedDouble className="h-4 w-4" />
                Agent Hotel Workspace
              </Link>
            ) : null}
          </div>
        </section>

        {!isAuthenticated ? (
          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
            Sign in as an agent to view your submitted requests and quotations.
            You can still submit a new offline hotel request without logging in.
          </section>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {isAuthenticated ? (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              {[
                { label: "My Requests", value: stats.total, icon: Hotel },
                { label: "Quotations", value: stats.quoted, icon: FileText },
                { label: "Confirmed", value: stats.confirmed, icon: BedDouble },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5"
                >
                  <p className="text-sm text-slate-400">{card.label}</p>
                  <p className="mt-2 text-3xl font-black text-white">{card.value}</p>
                </div>
              ))}
            </section>

            <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/70">
              <div className="border-b border-slate-800 px-5 py-4">
                <h2 className="text-lg font-semibold text-white">Your Requests</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-5 py-4">Guest</th>
                      <th className="px-5 py-4">Hotel</th>
                      <th className="px-5 py-4">Dates</th>
                      <th className="px-5 py-4">Quotation</th>
                      <th className="px-5 py-4">HCN</th>
                      <th className="px-5 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                          Loading your hotel requests...
                        </td>
                      </tr>
                    ) : data.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                          No hotel requests yet. Submit your first offline hotel request.
                        </td>
                      </tr>
                    ) : (
                      data.map((item) => (
                        <tr key={item.id}>
                          <td className="px-5 py-4 font-medium text-white">
                            {item.guest_name}
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-100">{item.hotel}</p>
                            <p className="text-xs text-slate-400">{item.city}</p>
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {item.check_in} → {item.check_out}
                            <p className="text-xs text-slate-500">{item.nights} nights</p>
                          </td>
                          <td className="px-5 py-4 text-slate-200">
                            {item.final_selling_rate || item.expected_market_price
                              ? `${item.final_selling_rate || item.expected_market_price} SAR`
                              : "Pending"}
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            {item.hcn || "Pending"}
                            <p className="text-xs text-slate-500">{item.hcn_status}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                statusBadge[item.status] || "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
