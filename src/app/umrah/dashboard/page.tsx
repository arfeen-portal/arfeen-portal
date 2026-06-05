"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function UmrahDashboardPage() {
  const [data, setData] = useState<any>({ packages: [], inventory: [], profit: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/umrah/dashboard")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const inventory = data.inventory || [];
    const profit = data.profit || [];

    return {
      packages: data.packages?.length || 0,
      seats: profit.reduce((s: number, p: any) => s + Number(p.seats_available || 0), 0),
      profit: profit.reduce((s: number, p: any) => s + Number(p.estimated_profit || 0), 0),
      pending: profit.reduce((s: number, p: any) => s + Number(p.pending_payments || 0), 0),
      lowStock: inventory.filter((i: any) => Number(i.total_qty || 0) - Number(i.booked_qty || 0) <= 5).length,
    };
  }, [data]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Umrah Command Center</h1>
          <p className="text-slate-500">Packages, inventory, seats, profit and payment intelligence.</p>
        </div>

        <div className="flex gap-3">
          <Link href="/umrah/packages/new" className="rounded-xl bg-black px-5 py-3 text-white">
            New Package
          </Link>
          <Link href="/umrah/hotels/new" className="rounded-xl border bg-white px-5 py-3">
            Add Inventory
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-8 shadow-sm">Loading...</div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-5">
            {[
              ["Packages", stats.packages],
              ["Available Seats", stats.seats],
              ["Estimated Profit", `${stats.profit.toLocaleString()} SAR`],
              ["Pending Payments", `${stats.pending.toLocaleString()} SAR`],
              ["Low Stock", stats.lowStock],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">{label}</p>
                <h2 className="mt-2 text-2xl font-bold">{value}</h2>
              </div>
            ))}
          </section>

          <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Live Package Profitability</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-left text-slate-500">
                  <tr>
                    <th className="py-3">Package</th>
                    <th>Code</th>
                    <th>Seats</th>
                    <th>Cost</th>
                    <th>Sale</th>
                    <th>Profit</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.profit || []).map((p: any) => (
                    <tr key={p.id} className="border-b">
                      <td className="py-3 font-medium">{p.package_name}</td>
                      <td>{p.package_code}</td>
                      <td>{p.seats_booked}/{p.seats_total}</td>
                      <td>{Number(p.inventory_cost || 0).toLocaleString()}</td>
                      <td>{Number(p.selling_price || 0).toLocaleString()}</td>
                      <td className="font-semibold">{Number(p.estimated_profit || 0).toLocaleString()}</td>
                      <td>{p.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}