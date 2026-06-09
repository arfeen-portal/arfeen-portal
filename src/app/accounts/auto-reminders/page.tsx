"use client";

import { useEffect, useMemo, useState } from "react";

type ReminderRow = {
  booking_id: string;
  customer_name: string;
  customer_phone: string;
  agent_name: string;
  pickup_city: string;
  dropoff_city: string;
  pickup_time: string;
  vehicle_type: string;
  status: string;
  reminder_type: string;
  priority: string;
  customer_message: string;
};

function badge(priority: string) {
  if (priority === "critical") return "bg-red-100 text-red-700";
  if (priority === "high") return "bg-orange-100 text-orange-700";
  if (priority === "medium") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

export default function AutoRemindersPage() {
  const [rows, setRows] = useState<ReminderRow[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/accounts/auto-reminders", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => setRows(json.data || []));
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => r.priority === filter || r.reminder_type === filter);
  }, [rows, filter]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-blue-950 to-slate-950 p-6 text-white shadow-xl">
        <p className="text-sm text-blue-200">Automation Center</p>
        <h1 className="mt-2 text-3xl font-bold">Auto Reminders</h1>
        <p className="mt-2 text-sm text-slate-300">
          Customer, agent and driver reminder intelligence based on pickup time, booking status and urgency.
        </p>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <Card title="Total Reminders" value={rows.length} />
        <Card title="Critical" value={rows.filter((r) => r.priority === "critical").length} />
        <Card title="High Priority" value={rows.filter((r) => r.priority === "high").length} />
        <Card title="Pending Confirmations" value={rows.filter((r) => r.reminder_type === "booking_confirmation_reminder").length} />
      </section>

      <div className="mb-5 flex justify-end">
        <select className="rounded-xl border bg-white px-4 py-3 text-sm shadow-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Reminders</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="urgent_pickup_reminder">Urgent Pickup</option>
          <option value="24_hour_reminder">24 Hour</option>
          <option value="booking_confirmation_reminder">Confirmation</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Pickup Time</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Message</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.booking_id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-3 font-semibold">{r.customer_name || "-"}</td>
                <td className="px-4 py-3">{r.customer_phone || "-"}</td>
                <td className="px-4 py-3">{r.pickup_city} → {r.dropoff_city}</td>
                <td className="px-4 py-3">{r.pickup_time ? new Date(r.pickup_time).toLocaleString() : "-"}</td>
                <td className="px-4 py-3">{r.reminder_type.replaceAll("_", " ")}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge(r.priority)}`}>{r.priority}</span>
                </td>
                <td className="px-4 py-3 text-slate-600">{r.customer_message}</td>
              </tr>
            ))}
          </tbody>
        </table>
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