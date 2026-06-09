"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BedDouble,
  Bell,
  Bot,
  CheckCircle2,
  Clock,
  FileText,
  Hotel,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

type Demand = {
  id: string;
  agent_name: string | null;
  guest_name: string;
  city: string;
  hotel: string;
  check_in: string;
  check_out: string;
  nights: number;
  room_type: string;
  rooms: number;
  pax: number;
  meal_plan: string | null;
  budget: number;
  urgency: string;
  status: string;
  duplicate_score: number;
  expected_market_price: number;
  risk_level: string;
  crowd_pressure: string;
  hcn: string | null;
  hcn_status: string;
  final_selling_rate: number;
  supplier_rate: number;
  profit_amount: number;
};

const statusBadge: Record<string, string> = {
  new: "bg-slate-100 text-slate-700",
  rfq_pending: "bg-amber-100 text-amber-800",
  quoted: "bg-blue-100 text-blue-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
};

export default function OfflineHotelDemandsPage() {
  const [data, setData] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/hotel-demands", { cache: "no-store" });
      const json = await res.json();
      setData(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return data.filter((item) =>
      [item.guest_name, item.agent_name, item.city, item.hotel, item.room_type, item.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [data, query]);

  const stats = useMemo(() => {
    return {
      total: data.length,
      pendingHcn: data.filter((x) => x.hcn_status === "pending").length,
      urgent: data.filter((x) => x.risk_level === "high" || x.risk_level === "critical").length,
      confirmed: data.filter((x) => x.status === "confirmed").length,
    };
  }, [data]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-8 text-white shadow-2xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-indigo-100">
                <Sparkles className="h-4 w-4" />
                Offline Hotel Demand Command Center
              </div>
              <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
                AI Hotel RFQ, Supplier Routing & HCN Tracker
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                Agent demand submit kare, system duplicate detect kare, WhatsApp RFQ route kare,
                supplier replies parse kare, profit apply kare, booking confirm kare, voucher generate kare
                aur HCN reminders auto track kare.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={loadData}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <Link
                href="/hotels/offline-demands/new"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-indigo-50"
              >
                <Plus className="h-4 w-4" />
                New Demand
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Total Demands", value: stats.total, icon: Hotel },
            { label: "Pending HCN", value: stats.pendingHcn, icon: Bell },
            { label: "Urgent Arrivals", value: stats.urgent, icon: ShieldAlert },
            { label: "Confirmed", value: stats.confirmed, icon: CheckCircle2 },
          ].map((card) => (
            <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{card.value}</p>
                </div>
                <div className="rounded-2xl bg-slate-100 p-3">
                  <card.icon className="h-6 w-6 text-slate-700" />
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          {[
            "Duplicate Detection",
            "AI Supplier Routing",
            "WhatsApp RFQ Automation",
            "AI Message Parsing",
            "Profit Engine",
            "HCN Auto Fetch",
            "Auto Voucher",
            "Smart Reminders",
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-indigo-50 p-2">
                  <Bot className="h-5 w-5 text-indigo-700" />
                </div>
                <p className="text-sm font-bold text-slate-800">{item}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-950">Live Hotel Demands</h2>
              <p className="text-sm text-slate-500">RFQ, quote, confirmation, voucher and HCN status in one screen.</p>
            </div>

            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search guest, hotel, city, status..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Guest / Agent</th>
                  <th className="px-5 py-4">Hotel</th>
                  <th className="px-5 py-4">Dates</th>
                  <th className="px-5 py-4">Room</th>
                  <th className="px-5 py-4">AI Price</th>
                  <th className="px-5 py-4">Risk</th>
                  <th className="px-5 py-4">HCN</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-slate-500">
                      Loading hotel demands...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-10 text-center text-slate-500">
                      No hotel demand found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-950">{item.guest_name}</p>
                        <p className="text-xs text-slate-500">{item.agent_name || "Agent Portal"}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">{item.hotel}</p>
                        <p className="text-xs text-slate-500">{item.city}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">{item.check_in}</p>
                        <p className="text-xs text-slate-500">
                          {item.check_out} · {item.nights} nights
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">{item.room_type}</p>
                        <p className="text-xs text-slate-500">
                          {item.rooms} rooms · {item.pax} pax · {item.meal_plan || "RO"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-950">{item.expected_market_price} SAR</p>
                        <p className="text-xs text-slate-500">Expected market</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                          <AlertTriangle className="h-3 w-3" />
                          {item.risk_level}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800">{item.hcn || "Pending"}</p>
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
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="rounded-xl border border-slate-200 p-2 hover:bg-white">
                            <MessageCircle className="h-4 w-4 text-slate-600" />
                          </button>
                          <button className="rounded-xl border border-slate-200 p-2 hover:bg-white">
                            <FileText className="h-4 w-4 text-slate-600" />
                          </button>
                          <button className="rounded-xl border border-slate-200 p-2 hover:bg-white">
                            <Clock className="h-4 w-4 text-slate-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}