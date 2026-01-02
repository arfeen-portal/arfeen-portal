import { supabase } from "@/lib/supabaseClient";
export const dynamic = "force-dynamic";
export default async function GroupTicketsPage() {
  const { data, error } = await supabase
    .from("group_tickets")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = (data as any[]) || [];

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Group Tickets</h1>
        <a
          href="/tickets/groups/new"
          className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
        >
          + New Group
        </a>
      </div>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          Error loading groups: {error.message}
        </div>
      )}

      <div className="overflow-x-auto rounded border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-600">
            <tr>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Airline</th>
              <th className="px-3 py-2">Route</th>
              <th className="px-3 py-2">Departure</th>
              <th className="px-3 py-2">Return</th>
              <th className="px-3 py-2">Seats</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => (
              <tr key={g.id} className="border-t">
                <td className="px-3 py-2 text-xs font-mono">{g.group_code}</td>
                <td className="px-3 py-2 text-xs">{g.airline || "-"}</td>
                <td className="px-3 py-2 text-xs">
                  {g.origin} → {g.destination}
                </td>
                <td className="px-3 py-2 text-xs">
                  {g.departure_date || "-"}
                </td>
                <td className="px-3 py-2 text-xs">{g.return_date || "-"}</td>
                <td className="px-3 py-2 text-xs">{g.total_seats}</td>
                <td className="px-3 py-2 text-xs">
                  {g.currency} {g.seat_price ?? "-"}
                </td>
                <td className="px-3 py-2 text-xs">{g.status}</td>
              </tr>
            ))}

            {!rows.length && !error && (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-4 text-center text-xs text-gray-500"
                >
                  No group tickets yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
