"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function UmrahFlightsPage() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/umrah/inventory?type=flight_seat")
      .then((res) => res.json())
      .then((json) => setItems(json.inventory || []));
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mb-6 flex justify-between">
        <div>
          <h1 className="text-3xl font-bold">Flight Seat Inventory</h1>
          <p className="text-slate-500">PNR, airline, seats, deadlines and group fare allocation.</p>
        </div>

        <Link href="/umrah/flights/new" className="rounded-xl bg-black px-5 py-3 text-white">
          Add Flight
        </Link>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-slate-500">
            <tr>
              <th className="py-3">Flight / PNR</th>
              <th>Supplier</th>
              <th>City</th>
              <th>Total</th>
              <th>Booked</th>
              <th>Available</th>
              <th>Cost</th>
              <th>Sale</th>
            </tr>
          </thead>
          <tbody>
            {items.map((f) => (
              <tr key={f.id} className="border-b">
                <td className="py-3 font-medium">{f.title}</td>
                <td>{f.supplier_name}</td>
                <td>{f.city}</td>
                <td>{f.total_qty}</td>
                <td>{f.booked_qty}</td>
                <td>{Number(f.total_qty || 0) - Number(f.booked_qty || 0)}</td>
                <td>{f.cost_price}</td>
                <td>{f.sale_price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}