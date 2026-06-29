"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Bell,
  Bot,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Hotel,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import { formatStayDates } from "@/lib/hotels/rfqValidation";

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
  notes: string | null;
  status: string;
  quote_status: string | null;
  duplicate_score: number;
  expected_market_price: number;
  risk_level: string;
  crowd_pressure: string;
  hcn: string | null;
  hcn_status: string;
  hcn_reference: string | null;
  final_selling_rate: number;
  final_offer_sar: number | null;
  supplier_rate: number;
  profit_amount: number;
  public_note: string | null;
  quoted_supplier: string | null;
  quoted_room_type: string | null;
  quoted_meal_plan: string | null;
  last_reminder_at: string | null;
};

type ModalKind = "view" | "quote" | "hcn" | "reminder" | null;

const statusBadge: Record<string, string> = {
  new: "bg-slate-100 text-slate-700",
  rfq_pending: "bg-amber-100 text-amber-800",
  quoted: "bg-blue-100 text-blue-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
};

type OfflineDemandCommandCenterProps = {
  newDemandHref?: string;
};

function StayDatesCell({
  checkIn,
  checkOut,
  nights,
}: {
  checkIn: string;
  checkOut: string;
  nights?: number | null;
}) {
  const formatted = formatStayDates(checkIn, checkOut, nights);

  return (
    <div className="text-xs leading-5 text-slate-700">
      {formatted.lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  );
}

export default function OfflineDemandCommandCenter({
  newDemandHref = "/hotels/offline-demands/new",
}: OfflineDemandCommandCenterProps) {
  const [data, setData] = useState<Demand[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [activeDemand, setActiveDemand] = useState<Demand | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [quoteForm, setQuoteForm] = useState({
    quoted_supplier: "",
    quoted_room_type: "",
    quoted_meal_plan: "",
    quoted_sar: "",
    selling_sar: "",
    public_note: "",
  });

  const [hcnForm, setHcnForm] = useState({
    hcn_status: "pending",
    hcn_reference: "",
  });

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/hotel-demands", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to load hotel demands");
      }
      setData(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load hotel demands");
      setData([]);
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

  function openModal(kind: ModalKind, demand: Demand) {
    setActiveDemand(demand);
    setModal(kind);
    setToast("");

    if (kind === "quote") {
      setQuoteForm({
        quoted_supplier: demand.quoted_supplier || demand.hotel || "",
        quoted_room_type: demand.quoted_room_type || demand.room_type || "",
        quoted_meal_plan: demand.quoted_meal_plan || demand.meal_plan || "BB",
        quoted_sar: demand.supplier_rate ? String(demand.supplier_rate) : "",
        selling_sar: String(demand.final_offer_sar ?? demand.final_selling_rate ?? ""),
        public_note: demand.public_note || "",
      });
    }

    if (kind === "hcn") {
      setHcnForm({
        hcn_status: demand.hcn_status || "pending",
        hcn_reference: demand.hcn_reference || demand.hcn || "",
      });
    }
  }

  function closeModal() {
    setModal(null);
    setActiveDemand(null);
    setActionLoading(false);
  }

  async function patchDemand(payload: Record<string, unknown>) {
    if (!activeDemand) return;

    setActionLoading(true);
    setToast("");

    try {
      const res = await fetch(`/api/hotel-demands/${activeDemand.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Update failed");
      }

      await loadData();
      closeModal();
      setToast("Update saved successfully.");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Update failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function submitQuote() {
    await patchDemand({
      action: "send_quote",
      ...quoteForm,
    });
  }

  async function submitHcn() {
    await patchDemand({
      action: "update_hcn",
      ...hcnForm,
    });
  }

  async function logReminder() {
    await patchDemand({ action: "log_reminder" });
  }

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
                Operations dashboard for RFQ routing, supplier quotes, profit engine,
                confirmations, vouchers, and HCN tracking.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadData}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/20"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <Link
                href={newDemandHref}
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 hover:bg-indigo-50"
              >
                <Plus className="h-4 w-4" />
                New Demand
              </Link>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {toast ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {toast}
          </div>
        ) : null}

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
              <p className="text-sm text-slate-500">
                RFQ, quote, confirmation, voucher and HCN status in one screen.
              </p>
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
                        <StayDatesCell
                          checkIn={item.check_in}
                          checkOut={item.check_out}
                          nights={item.nights}
                        />
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
                        {item.final_offer_sar || item.final_selling_rate ? (
                          <p className="mt-1 text-xs font-semibold text-indigo-700">
                            Offer: {item.final_offer_sar ?? item.final_selling_rate} SAR
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                          <AlertTriangle className="h-3 w-3" />
                          {item.risk_level}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800">
                          {item.hcn_reference || item.hcn || "Pending"}
                        </p>
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
                        {item.quote_status ? (
                          <p className="mt-1 text-xs text-slate-500">{item.quote_status}</p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <ActionButton
                            title="View details"
                            onClick={() => openModal("view", item)}
                          >
                            <Eye className="h-4 w-4 text-slate-600" />
                          </ActionButton>
                          <ActionButton
                            title="Add / send quote"
                            onClick={() => openModal("quote", item)}
                          >
                            <FileText className="h-4 w-4 text-slate-600" />
                          </ActionButton>
                          <ActionButton
                            title="Update HCN status"
                            onClick={() => openModal("hcn", item)}
                          >
                            <CheckCircle2 className="h-4 w-4 text-slate-600" />
                          </ActionButton>
                          <ActionButton
                            title="Log reminder"
                            onClick={() => openModal("reminder", item)}
                          >
                            <Clock className="h-4 w-4 text-slate-600" />
                          </ActionButton>
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

      {modal && activeDemand ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-black text-slate-950">
                {modal === "view" && "Demand Details"}
                {modal === "quote" && "Add / Send Quote"}
                {modal === "hcn" && "HCN Status"}
                {modal === "reminder" && "Log Reminder"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-slate-200 p-2 hover:bg-slate-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {modal === "view" ? (
                <ViewDemandDetails demand={activeDemand} />
              ) : null}

              {modal === "quote" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <ModalField
                    label="Supplier / Hotel Name"
                    value={quoteForm.quoted_supplier}
                    onChange={(v) => setQuoteForm((p) => ({ ...p, quoted_supplier: v }))}
                  />
                  <ModalField
                    label="Room Type"
                    value={quoteForm.quoted_room_type}
                    onChange={(v) => setQuoteForm((p) => ({ ...p, quoted_room_type: v }))}
                  />
                  <ModalField
                    label="Meal Plan"
                    value={quoteForm.quoted_meal_plan}
                    onChange={(v) => setQuoteForm((p) => ({ ...p, quoted_meal_plan: v }))}
                  />
                  <ModalField
                    label="Quoted SAR (supplier)"
                    type="number"
                    value={quoteForm.quoted_sar}
                    onChange={(v) => setQuoteForm((p) => ({ ...p, quoted_sar: v }))}
                  />
                  <ModalField
                    label="Selling SAR / Final Offer"
                    type="number"
                    value={quoteForm.selling_sar}
                    onChange={(v) => setQuoteForm((p) => ({ ...p, selling_sar: v }))}
                  />
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Notes to agent (public)
                    </label>
                    <textarea
                      value={quoteForm.public_note}
                      onChange={(e) =>
                        setQuoteForm((p) => ({ ...p, public_note: e.target.value }))
                      }
                      rows={4}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              ) : null}

              {modal === "hcn" ? (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">HCN Status</label>
                    <select
                      value={hcnForm.hcn_status}
                      onChange={(e) =>
                        setHcnForm((p) => ({ ...p, hcn_status: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="received">Received</option>
                      <option value="not_required">Not required</option>
                    </select>
                  </div>
                  {hcnForm.hcn_status === "received" ? (
                    <ModalField
                      label="HCN / Reference"
                      value={hcnForm.hcn_reference}
                      onChange={(v) => setHcnForm((p) => ({ ...p, hcn_reference: v }))}
                    />
                  ) : null}
                </div>
              ) : null}

              {modal === "reminder" ? (
                <div className="space-y-3 text-sm text-slate-600">
                  <p>
                    Log a reminder for <strong>{activeDemand.guest_name}</strong> at{" "}
                    <strong>{activeDemand.hotel}</strong>.
                  </p>
                  {activeDemand.last_reminder_at ? (
                    <p className="rounded-2xl bg-slate-50 px-4 py-3">
                      Last reminder: {new Date(activeDemand.last_reminder_at).toLocaleString()}
                    </p>
                  ) : (
                    <p className="rounded-2xl bg-slate-50 px-4 py-3">No reminder logged yet.</p>
                  )}
                  <p className="text-xs text-slate-500">
                    WhatsApp automation is not connected yet. Saving will record the reminder timestamp.
                  </p>
                </div>
              ) : null}

              {toast ? (
                <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{toast}</p>
              ) : null}
            </div>

            {modal !== "view" ? (
              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => {
                    if (modal === "quote") void submitQuote();
                    if (modal === "hcn") void submitHcn();
                    if (modal === "reminder") void logReminder();
                  }}
                  className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:bg-slate-300"
                >
                  {actionLoading ? "Saving..." : modal === "reminder" ? "Log Reminder" : "Save"}
                </button>
              </div>
            ) : (
              <div className="flex justify-end border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}

function ActionButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="rounded-xl border border-slate-200 p-2 hover:bg-white"
    >
      {children}
    </button>
  );
}

function ModalField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500"
      />
    </div>
  );
}

function ViewDemandDetails({ demand }: { demand: Demand }) {
  const dates = formatStayDates(demand.check_in, demand.check_out, demand.nights);

  return (
    <div className="grid gap-4 text-sm md:grid-cols-2">
      <Detail label="Guest" value={demand.guest_name} />
      <Detail label="Agent" value={demand.agent_name || "—"} />
      <Detail label="Hotel" value={`${demand.hotel} (${demand.city})`} />
      <Detail label="Room" value={`${demand.room_type} · ${demand.rooms} rooms · ${demand.pax} pax`} />
      <Detail label="Meal Plan" value={demand.meal_plan || "RO"} />
      <Detail label="Urgency" value={demand.urgency} />
      <Detail label="Stay" value={dates.lines.join(" · ")} />
      <Detail label="Status" value={`${demand.status} / ${demand.quote_status || "—"}`} />
      <Detail label="AI Expected Market" value={`${demand.expected_market_price} SAR`} />
      <Detail label="Supplier Rate" value={`${demand.supplier_rate || "—"} SAR`} />
      <Detail label="Final Offer" value={`${demand.final_offer_sar ?? demand.final_selling_rate ?? "—"} SAR`} />
      <Detail label="Profit" value={`${demand.profit_amount || "—"} SAR`} />
      <Detail label="Risk" value={demand.risk_level} />
      <Detail label="Duplicate Score" value={String(demand.duplicate_score ?? 0)} />
      <Detail label="HCN" value={`${demand.hcn_reference || demand.hcn || "Pending"} (${demand.hcn_status})`} />
      <Detail label="Public Note" value={demand.public_note || "—"} />
      <div className="md:col-span-2">
        <Detail label="Request Notes" value={demand.notes || "—"} />
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}
