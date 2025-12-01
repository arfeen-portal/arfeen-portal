"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type BookingStatus = "pending" | "confirmed" | "cancelled";
type RoomType = "sharing" | "quad" | "triple" | "double";
type LeadPriority = "low" | "medium" | "high";

interface AdminBookingRow {
  id: string;
  created_at: string;
  package_id: string | null;
  package_code: string | null;
  package_origin: string | null;
  package_dates: string | null;
  room_type: RoomType;
  full_name: string;
  phone: string;
  email: string | null;
  passengers: number;
  notes: string | null;
  status: BookingStatus;
  lead_score: number | null;
  priority: LeadPriority | null;
  source: string | null;
  agent_code: string | null;
  tracking_enabled: boolean;
  addons_summary: string | null;
}

interface PackageStats {
  key: string;
  package_code: string | null;
  package_origin: string | null;
  package_dates: string | null;
  total_bookings: number;
  total_passengers: number;
  pending: number;
  confirmed: number;
  cancelled: number;
}

const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  sharing: "Sharing",
  quad: "Quad",
  triple: "Triple",
  double: "Double",
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const PRIORITY_LABELS: Record<LeadPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const PRIORITY_COLORS: Record<LeadPriority, string> = {
  low: "bg-slate-100 text-slate-700 border-slate-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  high: "bg-rose-100 text-rose-800 border-rose-200",
};

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizePhoneForWhatsapp(raw: string) {
  let phone = raw.replace(/[^0-9+]/g, "");
  return phone;
}

function buildWhatsappMessage(b: AdminBookingRow) {
  const pkgPart = b.package_code
    ? `${b.package_code} (${b.package_origin ?? ""} – ${b.package_dates ?? ""})`
    : "your selected Umrah package";

  return (
    `Assalamualaikum ${b.full_name}!\n\n` +
    `Aap ki Umrah booking request Arfeen Travel & Tours ko mil gayi hai.\n\n` +
    `Package: ${pkgPart}\n` +
    `Room Type: ${ROOM_TYPE_LABELS[b.room_type]}\n` +
    `Passengers: ${b.passengers}\n\n` +
    `Hamari team jaldi aap se rabta karegi InshaAllah.\n` +
    `JazakAllah khair.`
  );
}

export default function AdminUmrahBookingsPage() {
  const [bookings, setBookings] = useState<AdminBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>(
    "all"
  );
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | LeadPriority
  >("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("umrah_bookings")
        .select(
          `
          id,
          package_id,
          room_type,
          full_name,
          phone,
          email,
          passengers,
          notes,
          status,
          created_at,
          lead_score,
          priority,
          source,
          agent_code,
          tracking_enabled,
          addons_summary,
          umrah_packages:package_id (
            code,
            origin_city,
            date_range
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setError("Failed to load bookings from Supabase.");
        setBookings([]);
        setLoading(false);
        return;
      }

      const mapped: AdminBookingRow[] =
        (data ?? []).map((row: any) => {
          const pkg = row.umrah_packages;
          return {
            id: row.id,
            created_at: row.created_at,
            package_id: row.package_id,
            package_code: pkg?.code ?? null,
            package_origin: pkg?.origin_city ?? null,
            package_dates: pkg?.date_range ?? null,
            room_type: row.room_type,
            full_name: row.full_name,
            phone: row.phone,
            email: row.email,
            passengers: row.passengers ?? 1,
            notes: row.notes,
            status: (row.status ?? "pending") as BookingStatus,
            lead_score:
              typeof row.lead_score === "number" ? row.lead_score : null,
            priority: (row.priority as LeadPriority) || "low",
            source: row.source ?? null,
            agent_code: row.agent_code ?? null,
            tracking_enabled: !!row.tracking_enabled,
            addons_summary: row.addons_summary ?? null,
          };
        }) ?? [];

      setBookings(mapped);
      setLoading(false);
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) {
        return false;
      }

      if (priorityFilter !== "all") {
        const p = (b.priority || "low") as LeadPriority;
        if (p !== priorityFilter) return false;
      }

      if (search.trim()) {
        const s = search.toLowerCase();
        const haystack =
          (b.full_name ?? "").toLowerCase() +
          " " +
          (b.phone ?? "").toLowerCase() +
          " " +
          (b.package_code ?? "").toLowerCase() +
          " " +
          (b.agent_code ?? "").toLowerCase();
        if (!haystack.includes(s)) return false;
      }

      return true;
    });
  }, [bookings, statusFilter, search, priorityFilter]);

  const dashboardStats = useMemo(() => {
    let total = bookings.length;
    let pending = 0;
    let confirmed = 0;
    let cancelled = 0;
    let totalPassengers = 0;

    for (const b of bookings) {
      totalPassengers += b.passengers || 0;
      if (b.status === "pending") pending++;
      if (b.status === "confirmed") confirmed++;
      if (b.status === "cancelled") cancelled++;
    }

    return { total, pending, confirmed, cancelled, totalPassengers };
  }, [bookings]);

  const perPackageStats = useMemo<PackageStats[]>(() => {
    const map = new Map<string, PackageStats>();

    for (const b of bookings) {
      const key = `${b.package_code ?? "NoCode"}|${b.package_origin ?? ""}|${
        b.package_dates ?? ""
      }`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          package_code: b.package_code,
          package_origin: b.package_origin,
          package_dates: b.package_dates,
          total_bookings: 0,
          total_passengers: 0,
          pending: 0,
          confirmed: 0,
          cancelled: 0,
        });
      }
      const ps = map.get(key)!;
      ps.total_bookings += 1;
      ps.total_passengers += b.passengers || 0;
      if (b.status === "pending") ps.pending += 1;
      if (b.status === "confirmed") ps.confirmed += 1;
      if (b.status === "cancelled") ps.cancelled += 1;
    }

    const arr = Array.from(map.values());
    arr.sort((a, b) => b.total_bookings - a.total_bookings);
    return arr;
  }, [bookings]);

  const handleStatusChange = async (id: string, newStatus: BookingStatus) => {
    setUpdatingId(id + newStatus);
    setError(null);
    try {
      const { error } = await supabase
        .from("umrah_bookings")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) {
        console.error(error);
        setError("Status update failed.");
      } else {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === id ? { ...b, status: newStatus } : b
          )
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleWhatsapp = (b: AdminBookingRow) => {
    const phone = normalizePhoneForWhatsapp(b.phone);
    if (!phone) {
      alert("Phone number is empty or invalid.");
      return;
    }
    const message = buildWhatsappMessage(b);
    const url =
      "https://wa.me/" +
      encodeURIComponent(phone) +
      "?text=" +
      encodeURIComponent(message);
    window.open(url, "_blank");
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      alert("No bookings to export for current filters.");
      return;
    }

    const header = [
      "Created At",
      "Status",
      "Priority",
      "Lead Score",
      "Full Name",
      "Phone",
      "Email",
      "Passengers",
      "Room Type",
      "Package Code",
      "Package Origin",
      "Package Dates",
      "Source",
      "Agent Code",
      "Tracking Enabled",
      "Addons Summary",
      "Notes",
    ];

    const rows = filtered.map((b) => [
      formatDateTime(b.created_at),
      b.status,
      b.priority || "low",
      (b.lead_score ?? 0).toString(),
      b.full_name,
      b.phone,
      b.email ?? "",
      b.passengers.toString(),
      ROOM_TYPE_LABELS[b.room_type],
      b.package_code ?? "",
      b.package_origin ?? "",
      b.package_dates ?? "",
      b.source ?? "",
      b.agent_code ?? "",
      b.tracking_enabled ? "yes" : "no",
      b.addons_summary ?? "",
      (b.notes ?? "").replace(/\s+/g, " "),
    ]);

    const csvContent =
      header.join(",") +
      "\n" +
      rows.map((r) => r.map((f) => `"${f.replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "umrah_bookings.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-slate-100 pb-12">
      <div className="mx-auto max-w-6xl px-4 pt-8">
        {/* HEADER */}
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Umrah Bookings — Admin
            </h1>
            <p className="mt-1 text-xs md:text-sm text-slate-500">
              View all booking forms, update status, export CSV and see
              per-package performance with smart lead priorities and add-ons.
            </p>
          </div>
          <div className="rounded-full bg-slate-900 px-4 py-2 text-[11px] font-semibold text-slate-100">
            Arfeen Travel &amp; Tours • Internal Panel
          </div>
        </header>

        {/* DASHBOARD CARDS */}
        <section className="mb-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-2xl border bg-white px-4 py-3 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">
              Total Bookings
            </div>
            <div className="mt-1 text-2xl font-bold text-slate-900">
              {dashboardStats.total}
            </div>
            <div className="mt-1 text-[11px] text-slate-400">
              Passengers: {dashboardStats.totalPassengers}
            </div>
          </div>
          <div className="rounded-2xl border bg-white px-4 py-3 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">
              Pending
            </div>
            <div className="mt-1 text-2xl font-bold text-amber-600">
              {dashboardStats.pending}
            </div>
          </div>
          <div className="rounded-2xl border bg-white px-4 py-3 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">
              Confirmed
            </div>
            <div className="mt-1 text-2xl font-bold text-emerald-600">
              {dashboardStats.confirmed}
            </div>
          </div>
          <div className="rounded-2xl border bg-white px-4 py-3 shadow-sm">
            <div className="text-[11px] font-semibold text-slate-500 uppercase">
              Cancelled
            </div>
            <div className="mt-1 text-2xl font-bold text-red-600">
              {dashboardStats.cancelled}
            </div>
          </div>
        </section>

        {/* FILTERS + EXPORT BAR */}
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {(["all", "pending", "confirmed", "cancelled"] as const).map(
              (st) => {
                const isActive = statusFilter === st;
                const label =
                  st === "all"
                    ? "All"
                    : STATUS_LABELS[st as BookingStatus];
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                );
              }
            )}
          </div>

          {/* Priority filter */}
          <div className="flex flex-wrap gap-2">
            {(["all", "low", "medium", "high"] as const).map((p) => {
              const isActive = priorityFilter === p;
              const label =
                p === "all" ? "All Priorities" : `Priority ${p}`;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() =>
                    setPriorityFilter(p === "all" ? "all" : p)
                  }
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                    isActive
                      ? "border-rose-600 bg-rose-600 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <input
              type="text"
              placeholder="Search name / phone / package / agent…"
              className="w-44 md:w-64 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="button"
              onClick={handleExportCSV}
              className="rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Export CSV (Excel)
            </button>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* TABLE / LIST */}
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden mb-6">
          {loading ? (
            <div className="p-6 text-center text-sm text-slate-500">
              Loading bookings…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              No bookings found for current filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs md:text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Customer</th>
                    <th className="px-3 py-2 text-left">Package</th>
                    <th className="px-3 py-2 text-left">Room / Pax</th>
                    <th className="px-3 py-2 text-left">Lead</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => {
                    const isB2B = !!b.agent_code;
                    return (
                      <tr
                        key={b.id}
                        className="border-t border-slate-100 hover:bg-slate-50/60"
                      >
                        {/* Date */}
                        <td className="px-3 py-2 align-top text-[11px] text-slate-500">
                          {formatDateTime(b.created_at)}
                        </td>

                        {/* Customer */}
                        <td className="px-3 py-2 align-top">
                          <div className="font-semibold text-slate-900">
                            {b.full_name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {b.phone}
                            {b.email && (
                              <>
                                {" · "}
                                {b.email}
                              </>
                            )}
                          </div>
                          <div className="mt-0.5 text-[10px] text-slate-400">
                            Source: {b.source || "N/A"}
                            {isB2B && (
                              <> · Agent: {b.agent_code}</>
                            )}
                          </div>
                          {b.notes && (
                            <div className="mt-1 text-[11px] text-slate-400">
                              {b.notes}
                            </div>
                          )}
                        </td>

                        {/* Package */}
                        <td className="px-3 py-2 align-top">
                          {b.package_code ? (
                            <>
                              <div className="font-semibold text-slate-900">
                                {b.package_code}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {b.package_origin} · {b.package_dates}
                              </div>
                            </>
                          ) : (
                            <div className="text-[11px] text-slate-400">
                              (Package deleted / not linked)
                            </div>
                          )}
                        </td>

                        {/* Room / Pax + Addons */}
                        <td className="px-3 py-2 align-top">
                          <div className="text-[11px] font-semibold text-slate-800">
                            {ROOM_TYPE_LABELS[b.room_type]}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Passengers: {b.passengers}
                          </div>
                          {b.addons_summary && (
                            <div className="mt-1 text-[10px] text-emerald-700">
                              Add-ons: {b.addons_summary}
                            </div>
                          )}
                          {isB2B ? (
                            <div className="mt-1 text-[10px] text-slate-500">
                              B2B booking (tracking disabled)
                            </div>
                          ) : (
                            <div className="mt-1 text-[10px] text-sky-700">
                              Tracking:{" "}
                              {b.tracking_enabled ? "Enabled" : "Disabled"}
                            </div>
                          )}
                        </td>

                        {/* Lead info */}
                        <td className="px-3 py-2 align-top">
                          <div className="flex flex-col gap-1">
                            <span
                              className={
                                "inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold " +
                                PRIORITY_COLORS[
                                  (b.priority || "low") as LeadPriority
                                ]
                              }
                            >
                              Priority{" "}
                              {PRIORITY_LABELS[
                                (b.priority || "low") as LeadPriority
                              ]}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Score: {b.lead_score ?? 0}/100
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-2 align-top">
                          <span
                            className={
                              "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold " +
                              STATUS_COLORS[b.status]
                            }
                          >
                            {STATUS_LABELS[b.status]}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-2 align-top text-right">
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex flex-wrap justify-end gap-1">
                              {(["pending", "confirmed", "cancelled"] as BookingStatus[]).map(
                                (st) => (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() =>
                                      handleStatusChange(b.id, st)
                                    }
                                    disabled={
                                      updatingId === b.id + st ||
                                      b.status === st
                                    }
                                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold transition ${
                                      b.status === st
                                        ? "border-slate-900 bg-slate-900 text-white"
                                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                                    } disabled:opacity-60`}
                                  >
                                    {STATUS_LABELS[st]}
                                  </button>
                                )
                              )}
                            </div>

                            {/* Timeline button – only B2C + tracking enabled */}
                            {!isB2B && b.tracking_enabled && (
                              <a
                                href={`/admin/umrah-bookings/${b.id}/timeline`}
                                className="inline-flex items-center gap-1 rounded-full bg-sky-600 px-3 py-1 text-[10px] font-semibold text-white shadow-sm hover:bg-sky-700"
                              >
                                Trip timeline
                              </a>
                            )}

                            {/* WhatsApp */}
                            <button
                              type="button"
                              onClick={() => handleWhatsapp(b)}
                              className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-semibold text-white shadow-sm hover:bg-emerald-600"
                            >
                              <span>WhatsApp</span>
                              <span className="text-[9px] opacity-80">
                                (auto text)
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PER-PACKAGE ANALYTICS */}
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-800">
              Per-package analytics (all bookings)
            </h2>
            <span className="text-[11px] text-slate-400">
              Top packages by number of bookings
            </span>
          </div>

          {perPackageStats.length === 0 ? (
            <div className="text-xs text-slate-500">
              No analytics yet – create some bookings first.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-[11px] md:text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Package</th>
                    <th className="px-3 py-2 text-left">City / Dates</th>
                    <th className="px-3 py-2 text-right">Bookings</th>
                    <th className="px-3 py-2 text-right">Passengers</th>
                    <th className="px-3 py-2 text-right">Pending</th>
                    <th className="px-3 py-2 text-right">Confirmed</th>
                    <th className="px-3 py-2 text-right">Cancelled</th>
                  </tr>
                </thead>
                <tbody>
                  {perPackageStats.map((p) => (
                    <tr
                      key={p.key}
                      className="border-t border-slate-100 hover:bg-slate-50/60"
                    >
                      <td className="px-3 py-2">
                        <div className="font-semibold text-slate-900">
                          {p.package_code ?? "(No Code)"}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-[11px] text-slate-600">
                          {p.package_origin ?? "-"} ·{" "}
                          {p.package_dates ?? "-"}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {p.total_bookings}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {p.total_passengers}
                      </td>
                      <td className="px-3 py-2 text-right text-amber-600">
                        {p.pending}
                      </td>
                      <td className="px-3 py-2 text-right text-emerald-600">
                        {p.confirmed}
                      </td>
                      <td className="px-3 py-2 text-right text-red-600">
                        {p.cancelled}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
