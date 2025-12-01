import Link from "next/link";
import { supabase } from "@/lib/supabaseClient"; // ✅ correct import

export const dynamic = "force-dynamic";

// TypeScript simple rakhne ke liye "any" use kar rahe hain
export default async function TransportBookingsPage({ searchParams }: any) {
  const agentParam = searchParams?.agent;
  const agentId = typeof agentParam === "string" ? agentParam : undefined;

  // Agents + bookings ek sath load
  const [{ data: agents }, { data: bookings, error }] = await Promise.all([
    supabase.from("agents").select("id, name").order("name"),
    loadBookings(agentId),
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Transport Bookings</h1>
        <Link
          href="/transport/form"
          className="px-3 py-2 bg-black text-white rounded text-sm"
        >
          + New Booking
        </Link>
      </div>

      {/* Agent filter */}
      <form method="get" className="flex items-center gap-2 text-sm">
        <label className="font-semibold">Agent:</label>
        <select
          name="agent"
          defaultValue={agentId ?? ""}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="">All agents</option>
          {agents?.map((a: any) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="px-3 py-1 border rounded text-sm bg-white hover:bg-gray-50"
        >
          Apply
        </button>
      </form>

      {error && (
        <div className="bg-red-100 text-red-700 text-sm p-2 rounded">
          Error loading bookings: {error.message}
        </div>
      )}

      <div className="border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">City</th>
              <th className="px-3 py-2 text-left">Route</th>
              <th className="px-3 py-2 text-center">Pax</th>
              <th className="px-3 py-2 text-center">Vehicle</th>
              <th className="px-3 py-2 text-left">Agent</th>
              <th className="px-3 py-2 text-center">Price</th>
              <th className="px-3 py-2 text-center">Status</th>
              <th className="px-3 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!bookings?.length && (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-4 text-center text-gray-500"
                >
                  No bookings found.
                </td>
              </tr>
            )}

            {bookings?.map((b: any) => (
              <tr key={b.id} className="border-t">
                <td className="px-3 py-2 whitespace-nowrap">
                  {b.transfer_date
                    ? new Date(b.transfer_date).toLocaleString()
                    : "-"}
                </td>
                <td className="px-3 py-2">{b.city}</td>
                <td className="px-3 py-2">
                  {b.pickup_type} → {b.drop_type}
                </td>
                <td className="px-3 py-2 text-center">{b.pax_count}</td>
                <td className="px-3 py-2 text-center">{b.vehicle_class}</td>
                <td className="px-3 py-2">{b.agent?.name ?? "-"}</td>
                <td className="px-3 py-2 text-center">
                  {b.currency} {b.price}
                </td>
                <td className="px-3 py-2 text-center">
                  <span className="px-2 py-1 rounded-full border text-xs">
                    {b.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  <Link
                    href={`/transport/book/${b.id}`}
                    className="text-xs px-2 py-1 border rounded"
                  >
                    View
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

async function loadBookings(agentId?: string) {
  let query = supabase
    .from("transport_bookings")
    .select(
      `
      id,
      transfer_date,
      city,
      pickup_type,
      drop_type,
      pax_count,
      vehicle_class,
      price,
      currency,
      status,
      agent:agents(name)
    `
    )
    .order("transfer_date", { ascending: false });

  if (agentId) {
    query = query.eq("agent_id", agentId);
  }

  const { data, error } = await query;
  return { data, error };
}
