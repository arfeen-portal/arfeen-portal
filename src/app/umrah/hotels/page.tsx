"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type HotelInventory = {
  id: string;
  hotel_name: string;
  supplier_name: string;
  city: string;
  category: string | null;
  sharing_rate: number | null;
  quad_rate: number | null;
  triple_rate: number | null;
  double_rate: number | null;
  currency: string | null;
  start_date: string | null;
  end_date: string | null;
  meal_plan: string | null;
  distance_from_haram: string | null;
  status: string | null;
};

export default function HotelInventoryPage() {
  const [items, setItems] = useState<HotelInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [city, setCity] = useState("All");

  const loadHotels = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/umrah/hotels", {
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to load hotels");
        return;
      }

      setItems(json.data || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load hotels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHotels();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const q = search.toLowerCase();

      const matchSearch =
        item.hotel_name?.toLowerCase().includes(q) ||
        item.supplier_name?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q);

      const matchCity = city === "All" || item.city === city;

      return matchSearch && matchCity;
    });
  }, [items, search, city]);

  const totalHotels = items.length;
  const makkahHotels = items.filter((x) => x.city === "Makkah").length;
  const madinahHotels = items.filter((x) => x.city === "Madinah").length;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border bg-white p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Hotel Inventory
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Supplier-wise Makkah/Madinah hotel rates for Umrah packages.
            </p>
          </div>

          <Link
            href="/umrah/hotels/new"
            className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white"
          >
            Add Hotel
          </Link>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Stat title="Total Inventory" value={totalHotels} />
          <Stat title="Makkah Hotels" value={makkahHotels} />
          <Stat title="Madinah Hotels" value={madinahHotels} />
        </div>

        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="mb-5 grid gap-3 md:grid-cols-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search hotel, supplier, category..."
              className="rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300 md:col-span-2"
            />

            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="All">All Cities</option>
              <option value="Makkah">Makkah</option>
              <option value="Madinah">Madinah</option>
            </select>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">
              Loading hotel inventory...
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-red-50 p-5 text-sm text-red-700">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-8 text-center">
              <p className="font-semibold text-slate-800">
                No hotel inventory found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Add first hotel inventory from Add Hotel button.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                    <th className="px-4 py-3">Hotel</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Sharing</th>
                    <th className="px-4 py-3">Quad</th>
                    <th className="px-4 py-3">Triple</th>
                    <th className="px-4 py-3">Double</th>
                    <th className="px-4 py-3">Validity</th>
                    <th className="px-4 py-3">Meal</th>
                    <th className="px-4 py-3">Distance</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-4 font-semibold text-slate-900">
                        {item.hotel_name}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {item.supplier_name}
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {item.city}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {item.category || "-"}
                      </td>
                      <td className="px-4 py-4 font-semibold">
                        {item.sharing_rate || 0} {item.currency || "SAR"}
                      </td>
                      <td className="px-4 py-4 font-semibold">
                        {item.quad_rate || 0} {item.currency || "SAR"}
                      </td>
                      <td className="px-4 py-4 font-semibold">
                        {item.triple_rate || 0} {item.currency || "SAR"}
                      </td>
                      <td className="px-4 py-4 font-semibold">
                        {item.double_rate || 0} {item.currency || "SAR"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {item.start_date || "-"} → {item.end_date || "-"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {item.meal_plan || "-"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {item.distance_from_haram || "-"}
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

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-3xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}