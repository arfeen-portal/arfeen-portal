"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function UmrahPackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/umrah/packages")
      .then((res) => res.json())
      .then((json) => setPackages(json.packages || []));
  }, []);

  const filtered = useMemo(() => {
    return packages.filter((p) =>
      `${p.package_name} ${p.package_code} ${p.status}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [packages, search]);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">Umrah Packages</h1>
          <p className="text-slate-500">Advanced package list with profit, seats and inventory costing.</p>
        </div>

        <Link href="/umrah/packages/new" className="rounded-xl bg-black px-5 py-3 text-white">
          Create Package
        </Link>
      </div>

      <input
        className="mb-5 w-full rounded-xl border bg-white px-4 py-3"
        placeholder="Search package, code, status..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid gap-4">
        {filtered.map((p) => (
          <div key={p.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-xl font-semibold">{p.package_name}</h2>
                <p className="text-sm text-slate-500">{p.package_code} • {p.status}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                <div>
                  <p className="text-slate-500">Seats</p>
                  <b>{p.seats_booked}/{p.seats_total}</b>
                </div>
                <div>
                  <p className="text-slate-500">Cost</p>
                  <b>{Number(p.inventory_cost || 0).toLocaleString()}</b>
                </div>
                <div>
                  <p className="text-slate-500">Sale</p>
                  <b>{Number(p.selling_price || 0).toLocaleString()}</b>
                </div>
                <div>
                  <p className="text-slate-500">Profit</p>
                  <b>{Number(p.estimated_profit || 0).toLocaleString()}</b>
                </div>
              </div>

              <div className="flex gap-2">
                <Link href={`/umrah/packages/${p.id}/pricing`} className="rounded-lg border px-4 py-2">
                  Pricing
                </Link>
                <Link href={`/umrah/packages/${p.id}/itinerary`} className="rounded-lg border px-4 py-2">
                  Itinerary
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}