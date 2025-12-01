import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function GroupTicketsListPage() {
  const { data, error } = await supabase
    .from("group_ticket_batches")
    .select("*")
    .order("created_at", { ascending: false });

  const batches = data || [];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Group Ticket Batches</h1>
        <Link
          href="/group-tickets/new"
          className="px-3 py-2 text-sm bg-black text-white rounded hover:bg-gray-800"
        >
          + New batch
        </Link>
      </div>

      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Route</th>
              <th className="px-3 py-2">Dates</th>
              <th className="px-3 py-2">Seats</th>
              <th className="px-3 py-2">Base fare</th>
            </tr>
          </thead>
          <tbody>
            {batches.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-4 text-center text-gray-500"
                >
                  No group batches yet.
                </td>
              </tr>
            )}

            {batches.map((b: any) => (
              <tr key={b.id} className="border-t">
                <td className="px-3 py-2">{b.name}</td>
                <td className="px-3 py-2">
                  {b.from_city} → {b.to_city}
                </td>
                <td className="px-3 py-2">
                  {b.depart_date} {b.return_date ? ` / ${b.return_date}` : ""}
                </td>
                <td className="px-3 py-2">{b.seat_count}</td>
                <td className="px-3 py-2">
                  {b.currency || "PKR"} {b.base_fare}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
