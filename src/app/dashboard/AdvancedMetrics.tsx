import { supabaseClient } from "@/lib/supabaseClient";

export default async function AdvancedMetrics() {
  const supabase = supabaseClient;

  const [{ data: monthlyRevenue }, { data: topRoutes }, { data: arrivalStats }] =
    await Promise.all([
      supabase.from("v_monthly_revenue").select("*").limit(6),
      supabase.from("v_top_routes").select("*").limit(15),
      supabase.from("v_arrival_departure_stats").select("*"),
    ]);

  return (
    <div className="grid gap-4 md:grid-cols-3 mt-6">
      <div className="border rounded-xl p-4 shadow-sm bg-white">
        <h3 className="font-semibold text-sm mb-2">Monthly Revenue (Last 6)</h3>
        <div className="space-y-1 text-xs">
          {monthlyRevenue?.map((row: any) => (
            <div key={row.month} className="flex justify-between">
              <span>
                {new Date(row.month).toLocaleDateString("en-US", {
                  month: "short",
                  year: "2-digit",
                })}
              </span>
              <span>{Number(row.total_revenue).toLocaleString()} SAR</span>
            </div>
          )) || <p className="text-xs text-gray-500">No data</p>}
        </div>
      </div>

      <div className="border rounded-xl p-4 shadow-sm bg-white">
        <h3 className="font-semibold text-sm mb-2">Top Routes</h3>
        <div className="space-y-1 text-xs">
          {topRoutes?.map((row: any, idx: number) => (
            <div key={idx} className="flex justify-between">
              <span>
                {row.pickup_city} → {row.dropoff_city}
              </span>
              <span>{row.total_trips} trips</span>
            </div>
          )) || <p className="text-xs text-gray-500">No data</p>}
        </div>
      </div>

      <div className="border rounded-xl p-4 shadow-sm bg-white">
        <h3 className="font-semibold text-sm mb-2">Arrival / Departure</h3>
        <div className="space-y-1 text-xs">
          {arrivalStats?.map((row: any) => (
            <div key={row.category} className="flex justify-between">
              <span>{row.category?.replace("_", " ")}</span>
              <span>{row.total_trips}</span>
            </div>
          )) || <p className="text-xs text-gray-500">No data</p>}
        </div>
      </div>
    </div>
  );
}