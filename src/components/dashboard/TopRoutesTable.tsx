"use client";

import React from "react";

type RouteItem = {
  route_name: string;
  total_bookings: number;
  total_revenue: number;
};

type TopRoutesTableProps = {
  data?: RouteItem[];
};

const defaultRoutes: RouteItem[] = [
  {
    route_name: "Jeddah → Makkah",
    total_bookings: 148,
    total_revenue: 245000,
  },
  {
    route_name: "Makkah → Madinah",
    total_bookings: 121,
    total_revenue: 218000,
  },
  {
    route_name: "Madinah Airport → Hotel",
    total_bookings: 96,
    total_revenue: 132000,
  },
  {
    route_name: "Jeddah Airport → Makkah",
    total_bookings: 88,
    total_revenue: 167500,
  },
];

export default function TopRoutesTable({
  data = defaultRoutes,
}: TopRoutesTableProps) {
  const safeRoutes = data.length ? data : defaultRoutes;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Top Routes</h3>
        <p className="mt-1 text-sm text-slate-500">
          Highest-performing transport routes
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 text-sm text-slate-500">
              <th className="px-3 py-3 font-medium">Route</th>
              <th className="px-3 py-3 font-medium">Bookings</th>
              <th className="px-3 py-3 font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {safeRoutes.map((item) => (
              <tr
                key={item.route_name}
                className="border-b border-slate-100 text-sm"
              >
                <td className="px-3 py-3 font-medium text-slate-900">
                  {item.route_name}
                </td>
                <td className="px-3 py-3 text-slate-600">
                  {item.total_bookings}
                </td>
                <td className="px-3 py-3 text-slate-600">
                  PKR {Number(item.total_revenue).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}