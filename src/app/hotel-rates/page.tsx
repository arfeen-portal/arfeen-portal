import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HotelRatesListPage() {
  const { data } = await supabase
    .from("hotel_rate_plans")
    .select("id, name, currency, price_per_night, is_active, hotel:hotel_id (name, city)")
    .order("created_at", { ascending: false });

  const rates = data || [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Hotel Rate Plans</h1>
        <Link
          href="/hotel-rates/new"
          className="px-3 py-2 bg-black text-white rounded text-sm"
        >
          + New Rate Plan
        </Link>
      </div>

      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2">Hotel</th>
              <th className="px-3 py-2">City</th>
              <th className="px-3 py-2">Plan</th>
              <th className="px-3 py-2">Rate</th>
              <th className="px-3 py-2">Active</th>
            </tr>
          </thead>
          <tbody>
            {rates.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-gray-500">
                  No rate plans yet.
                </td>
              </tr>
            )}

            {rates.map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{r.hotel?.name}</td>
                <td className="px-3 py-2">{r.hotel?.city}</td>
                <td className="px-3 py-2">{r.name}</td>
                <td className="px-3 py-2">
                  {r.currency} {r.price_per_night}
                </td>
                <td className="px-3 py-2">
                  {r.is_active ? "Yes" : "No"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
