import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HotelBookingsListPage() {
  const { data } = await supabase
    .from("hotel_bookings")
    .select(
      `
      id,
      guest_name,
      agent_name,
      check_in,
      check_out,
      rooms,
      total_price,
      currency,
      status,
      hotel:hotel_id ( name, city )
    `
    )
    .order("created_at", { ascending: false });

  const bookings = data || [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Hotel Bookings</h1>
        <Link
          href="/hotel-bookings/new"
          className="px-3 py-2 bg-black text-white rounded text-sm"
        >
          + New Booking
        </Link>
      </div>

      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2">Guest</th>
              <th className="px-3 py-2">Hotel</th>
              <th className="px-3 py-2">Dates</th>
              <th className="px-3 py-2">Rooms</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-gray-500">
                  No bookings yet.
                </td>
              </tr>
            )}

            {bookings.map((b: any) => (
              <tr key={b.id} className="border-t">
                <td className="px-3 py-2">
                  {b.guest_name}
                  {b.agent_name && (
                    <span className="block text-[11px] text-gray-500">
                      via {b.agent_name}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {b.hotel?.name}
                  <span className="block text-[11px] text-gray-500">
                    {b.hotel?.city}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {b.check_in} → {b.check_out}
                </td>
                <td className="px-3 py-2">{b.rooms}</td>
                <td className="px-3 py-2">
                  {b.currency} {b.total_price || "-"}
                </td>
                <td className="px-3 py-2 capitalize">{b.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
