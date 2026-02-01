import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

export const dynamic = "force-dynamic";
export default async function FlightOffersPage() {
  const { data, error } = await supabase
    .from("flight_offers")
    .select(
      `
      id,
      search_id,
      airline,
      flight_code,
      fare_family,
      currency,
      total_price,
      created_at
    `
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data as any[]) || [];

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-semibold">Flight Offers (log)</h1>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          Error loading offers: {error.message}
        </div>
      )}

      <div className="overflow-x-auto rounded border bg-white">
        <table className="min-w-full text-left text-xs">
          <thead className="bg-gray-50 font-semibold uppercase text-gray-600">
            <tr>
              <th className="px-3 py-2">Airline</th>
              <th className="px-3 py-2">Flight</th>
              <th className="px-3 py-2">Fare</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Search ID</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="px-3 py-2">{o.airline || "-"}</td>
                <td className="px-3 py-2">{o.flight_code || "-"}</td>
                <td className="px-3 py-2">{o.fare_family || "-"}</td>
                <td className="px-3 py-2">
                  {o.currency} {o.total_price}
                </td>
                <td className="px-3 py-2 text-[10px] font-mono">
                  {o.search_id}
                </td>
                <td className="px-3 py-2 text-[10px]">{o.created_at}</td>
              </tr>
            ))}

            {!rows.length && !error && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-4 text-center text-xs text-gray-500"
                >
                  No offers yet (jab API integrate hogi, yahan data ayega).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
