"use client";

import { useEffect, useMemo, useState } from "react";

type AssignRow = {
  booking_id: string;
  customer_name: string;
  pickup_city: string;
  dropoff_city: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  vehicle_type: string;
  passengers: number;
  driver_id: string | null;
  status: string;
  assignment_status: string;
  urgency_score: number;
  ai_reason: string;
};

function statusClass(status: string) {
  if (status === "urgent_assign_required") return "bg-red-100 text-red-700";
  if (status === "ready_for_auto_assign") return "bg-blue-100 text-blue-700";
  if (status === "assigned") return "bg-emerald-100 text-emerald-700";
  return "bg-amber-100 text-amber-700";
}

export default function AutoDriverAssignPage() {
  const [rows, setRows] = useState<AssignRow[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/auto-driver-assign", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => setRows(json.data || []));
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => r.assignment_status === filter);
  }, [rows, filter]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-blue-700">Driver Automation</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">Auto Driver Assign</h1>
        <p className="mt-2 text-sm text-slate-500">
          AI-style dispatch queue for urgent, ready and already assigned transport bookings.
        </p>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <Card title="Total Jobs" value={rows.length} />
        <Card title="Urgent Assign" value={rows.filter((r) => r.assignment_status === "urgent_assign_required").length} />
        <Card title="Ready Assign" value={rows.filter((r) => r.assignment_status === "ready_for_auto_assign").length} />
        <Card title="Assigned" value={rows.filter((r) => r.assignment_status === "assigned").length} />
      </section>

      <div className="mb-5 flex justify-end">
        <select className="rounded-xl border bg-white px-4 py-3 text-sm shadow-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="urgent_assign_required">Urgent Assign Required</option>
          <option value="ready_for_auto_assign">Ready For Assign</option>
          <option value="needs_time_before_assign">Needs Time</option>
          <option value="assigned">Assigned</option>
        </select>
      </div>

      <div className="grid gap-4">
        {filtered.map((r) => (
          <div key={r.booking_id} className="rounded-3xl border bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-950">{r.customer_name || "Guest Booking"}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {r.pickup_city} → {r.dropoff_city} | {r.vehicle_type || "Vehicle TBA"} | {r.passengers || 0} pax
                </p>
                <p className="mt-2 text-sm text-slate-600">{r.ai_reason}</p>
              </div>

              <div className="text-right">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(r.assignment_status)}`}>
                  {r.assignment_status.replaceAll("_", " ")}
                </span>
                <p className="mt-2 text-2xl font-bold text-slate-950">{r.urgency_score}%</p>
                <p className="text-xs text-slate-500">Urgency Score</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm md:grid-cols-3">
              <p><b>Pickup:</b> {r.pickup_location || "-"}</p>
              <p><b>Dropoff:</b> {r.dropoff_location || "-"}</p>
              <p><b>Time:</b> {r.pickup_time ? new Date(r.pickup_time).toLocaleString() : "-"}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </div>
  );
}