export const dynamic = "force-dynamic";

import PageHeader from "@/components/layout/PageHeader";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default async function TransportAnalyticsPage() {
  const supabase = getSupabaseClient();

  // Top routes
  const { data: topRoutes } = await supabase
    .from("vw_top_routes")
    .select("*")
    .limit(20);

  // Arrival / departure stats
  const { data: arrivalDeparture } = await supabase
    .from("vw_arrival_departure_stats")
    .select("*");

  return (
    <main className="p-6 space-y-6">
      <PageHeader
        title="Transport Analytics"
        subtitle="Top routes and Makkah/Madinah arrival & departure summary"
      />

      {/* Top Routes */}
      <section className="border rounded-xl bg-white p-4">
        <h2 className="text-sm font-semibold mb-3">Top Routes by Trips</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Pickup</th>
                <th className="px-3 py-2 text-left">Dropoff</th>
                <th className="px-3 py-2 text-right">Trips</th>
                <th className="px-3 py-2 text-right">Total Revenue</th>
              </tr>
            </thead>

            <tbody>
              {topRoutes?.map((r: any, idx: number) => (
                <tr key={idx} className="border-t">
                  <td className="px-3 py-2">{r.pickup_city}</td>
                  <td className="px-3 py-2">{r.dropoff_city}</td>
                  <td className="px-3 py-2 text-right">{r.total_trips ?? 0}</td>
                  <td className="px-3 py-2 text-right">
                    {Number(r.total_revenue ?? 0).toLocaleString()}
                  </td>
                </tr>
              ))}

              {!topRoutes?.length && (
                <tr>
                  <td
                    className="px-3 py-2 text-xs text-gray-500"
                    colSpan={4}
                  >
                    No data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Arrival / Departure */}
      <section className="border rounded-xl bg-white p-4">
        <h2 className="text-sm font-semibold mb-3">
          Makkah / Madinah Arrival & Departure
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {arrivalDeparture?.map((row: any, idx: number) => (
            <div
              key={idx}
              className="border rounded-lg p-3 bg-gray-50 flex flex-col"
            >
              <span className="font-semibold mb-1 capitalize">
                {row.category?.replace("_", " ")}
              </span>
              <span className="text-gray-600">
                Trips:{" "}
                <span className="font-semibold">
                  {row.total_trips ?? 0}
                </span>
              </span>
            </div>
          ))}

          {!arrivalDeparture?.length && (
            <p className="text-xs text-gray-500">
              No arrival/departure data found.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
