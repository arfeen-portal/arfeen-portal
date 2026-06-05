"use client";

import React from "react";

type RevenueItem = {
  month_key: string;
  month_label: string;
  revenue: number;
  bookings: number;
};

type RevenueChartProps = {
  data?: RevenueItem[];
};

const defaultData: RevenueItem[] = [
  { month_key: "2026-01", month_label: "Jan", revenue: 12000, bookings: 12 },
  { month_key: "2026-02", month_label: "Feb", revenue: 18500, bookings: 18 },
  { month_key: "2026-03", month_label: "Mar", revenue: 15000, bookings: 15 },
  { month_key: "2026-04", month_label: "Apr", revenue: 22000, bookings: 20 },
  { month_key: "2026-05", month_label: "May", revenue: 19800, bookings: 19 },
  { month_key: "2026-06", month_label: "Jun", revenue: 26400, bookings: 24 },
];

export default function RevenueChart({ data = defaultData }: RevenueChartProps) {
  const safeData = data.length ? data : defaultData;
  const maxValue = Math.max(...safeData.map((item) => item.revenue), 1);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-slate-900">Revenue Overview</h3>
        <p className="mt-1 text-sm text-slate-500">
          Monthly revenue and booking performance
        </p>
      </div>

      <div className="flex h-72 items-end gap-3">
        {safeData.map((item) => {
          const height = `${Math.max((item.revenue / maxValue) * 100, 8)}%`;

          return (
            <div
              key={item.month_key}
              className="flex flex-1 flex-col items-center"
            >
              <div className="mb-2 text-xs font-medium text-slate-500">
                PKR {Number(item.revenue).toLocaleString()}
              </div>

              <div className="flex h-56 w-full items-end rounded-xl bg-slate-50 p-2">
                <div
                  className="w-full rounded-lg bg-slate-900 transition-all"
                  style={{ height }}
                />
              </div>

              <div className="mt-3 text-sm font-medium text-slate-700">
                {item.month_label}
              </div>

              <div className="mt-1 text-xs text-slate-500">
                {item.bookings} bookings
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}