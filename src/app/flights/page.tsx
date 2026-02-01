import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FlightsListPage() {
  const { data } = await supabase
    .from("flight_segments")
    .select("*")
    .order("created_at", { ascending: false });

  const flights = data || [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Flights</h1>
        <Link
          href="/flights/new"
          className="px-3 py-2 bg-black text-white rounded text-sm"
        >
          + Add flight
        </Link>
      </div>

      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2">Airline</th>
              <th className="px-3 py-2">Flight No</th>
              <th className="px-3 py-2">Route</th>
              <th className="px-3 py-2">Depart</th>
              <th className="px-3 py-2">Arrive</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {flights.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-gray-600">
                  No flights added yet.
                </td>
              </tr>
            )}

            {flights.map((f: any) => (
              <tr key={f.id} className="border-t">
                <td className="px-3 py-2">{f.airline}</td>
                <td className="px-3 py-2">{f.flight_no}</td>
                <td className="px-3 py-2">
                  {f.from_city} → {f.to_city}
                </td>
                <td className="px-3 py-2">{f.depart_time}</td>
                <td className="px-3 py-2">{f.arrive_time}</td>
                <td className="px-3 py-2">
                  {f.currency} {f.base_price}
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/flights/${f.id}/edit`}
                    className="text-blue-600 text-xs"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
