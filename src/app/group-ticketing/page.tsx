import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function GroupTicketingListPage() {
  const { data: batches } = await supabase
    .from("group_ticket_batches")
    .select(
      "id, name, airline, from_city, to_city, flight_date, total_seats, base_fare, tax, currency"
    )
    .order("created_at", { ascending: false });

  const { data: bookings } = await supabase
    .from("group_ticket_bookings")
    .select("batch_id, pax, sale_price_per_pax");

  const stats = new Map<
    string,
    { sold: number; revenue: number }
  >();

  bookings?.forEach((b) => {
    const entry = stats.get(b.batch_id) || { sold: 0, revenue: 0 };
    entry.sold += b.pax;
    entry.revenue += b.pax * Number(b.sale_price_per_pax || 0);
    stats.set(b.batch_id, entry);
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Group Ticket Batches</h1>
        <Link
          href="/group-ticketing/new"
          className="px-3 py-2 bg-black text-white rounded text-sm"
        >
          + New Batch
        </Link>
      </div>

      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">Batch</th>
              <th className="px-3 py-2">Sector</th>
              <th className="px-3 py-2">Flight date</th>
              <th className="px-3 py-2">Seats (sold/total)</th>
              <th className="px-3 py-2">Base+Tax</th>
              <th className="px-3 py-2">Revenue</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {!batches?.length && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-4 text-center text-gray-500"
                >
                  No group ticket batches yet.
                </td>
              </tr>
            )}

            {batches?.map((b) => {
              const stat = stats.get(b.id) || { sold: 0, revenue: 0 };
              return (
                <tr key={b.id} className="border-t">
                  <td className="px-3 py-2">
                    <div className="font-medium">{b.name}</div>
                    <div className="text-[11px] text-gray-500">
                      {b.airline}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {b.from_city} → {b.to_city}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {b.flight_date || "-"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {stat.sold} / {b.total_seats}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {b.currency}{" "}
                    {Number(b.base_fare || 0) + Number(b.tax || 0)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {b.currency} {stat.revenue}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/group-ticketing/${b.id}/bookings/new`}
                      className="text-xs px-2 py-1 border rounded"
                    >
                      + Booking
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
