"use client";

import React from "react";

type RecentBooking = {
  id: string | number;
  customer_name: string | null;
  agent_name: string | null;
  pickup_city: string | null;
  dropoff_city: string | null;
  pickup_time: string | null;
  status: string | null;
  total_price: number | null;
};

type AnalyticsWidgetsProps = {
  recentBookings?: RecentBooking[];
};

function formatDateTime(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

export default function AnalyticsWidgets({
  recentBookings = [],
}: AnalyticsWidgetsProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Recent Bookings</h3>
        <p className="mt-1 text-sm text-slate-500">
          Latest booking activity from dashboard widgets API
        </p>
      </div>

      {recentBookings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
          No recent bookings found.
        </div>
      ) : (
        <div className="space-y-3">
          {recentBookings.map((booking) => (
            <div
              key={String(booking.id)}
              className="rounded-xl border border-slate-200 p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {booking.customer_name || "Unknown Customer"}
                  </p>

                  <p className="text-sm text-slate-600">
                    {booking.pickup_city || "—"} → {booking.dropoff_city || "—"}
                  </p>

                  <p className="text-xs text-slate-500">
                    Agent: {booking.agent_name || "—"}
                  </p>

                  <p className="text-xs text-slate-500">
                    Pickup Time: {formatDateTime(booking.pickup_time)}
                  </p>
                </div>

                <div className="flex flex-col items-start gap-2 lg:items-end">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {booking.status || "Unknown"}
                  </span>

                  <p className="text-sm font-semibold text-slate-900">
                    PKR {Number(booking.total_price ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}