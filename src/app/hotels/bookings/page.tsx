import { supabase } from "@/lib/supabaseClient";

export default async function HotelBookingsPage() {
  const { data, error } = await supabase
    .from("hotel_bookings")
    .select(
      `
      id,
      hotel_id,
      room_id,
      checkin_date,
      checkout_date,
      nights,
      pax_count,
      currency,
      total_price,
      guest_name,
      agent_name,
      booking_status,
      hotel_properties ( name, city )
    `
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data as any[]) || [];

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Hotel Bookings</h1>
        <a
          href="/hotels/bookings/new"
          className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
        >
          + New Booking
        </a>
      </div>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          Error loading bookings: {error.message}
        </div>
      )}

      <div className="overflow-x-auto rounded border bg-white">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-gray-50 font-semibold uppercase text-gray-600">
            <tr>
              <th className="px-3 py-2">Hotel</th>
              <th className="px-3 py-2">City</th>
              <th className="px-3 py-2">Guest</th>
              <th className="px-3 py-2">Dates</th>
              <th className="px-3 py-2">Pax</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Agent</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="px-3 py-2">
                  {b.hotel_properties?.name || "-"}
                </td>
                <td className="px-3 py-2 text-xs">
                  {b.hotel_properties?.city || "-"}
                </td>
                <td className="px-3 py-2 text-xs">{b.guest_name || "-"}</td>
                <td className="px-3 py-2 text-xs">
                  {b.checkin_date} → {b.checkout_date}
                </td>
                <td className="px-3 py-2 text-xs">{b.pax_count ?? "-"}</td>
                <td className="px-3 py-2 text-xs">
                  {b.currency} {b.total_price ?? "-"}
                </td>
                <td className="px-3 py-2 text-xs">{b.booking_status}</td>
                <td className="px-3 py-2 text-xs">{b.agent_name || "-"}</td>
              </tr>
            ))}

            {!rows.length && !error && (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-4 text-center text-xs text-gray-500"
                >
                  No hotel bookings yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
