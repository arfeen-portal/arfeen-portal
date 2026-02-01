import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

export const dynamic = "force-dynamic";
export default async function SalesChartsPage() {
  const { data: daily } = await supabase
    .from("v_transport_sales_daily")
    .select("*")
    .limit(30);

  const { data: byCity } = await supabase
    .from("v_transport_sales_by_city")
    .select("*")
    .limit(20);

  const { data: byStatus } = await supabase
    .from("v_transport_bookings_by_status")
    .select("*");

  const { data: byVehicle } = await supabase
    .from("v_transport_vehicle_usage")
    .select("*");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Transport Sales Overview</h1>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Daily Sales (last 30 days)</h2>
        <div className="overflow-x-auto rounded border bg-white">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2">Day</th>
                <th className="px-3 py-2">Bookings</th>
                <th className="px-3 py-2">Pax</th>
                <th className="px-3 py-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {daily?.map((r: any) => (
                <tr key={r.day} className="border-t">
                  <td className="px-3 py-2">{r.day}</td>
                  <td className="px-3 py-2">{r.total_bookings}</td>
                  <td className="px-3 py-2">{r.total_pax}</td>
                  <td className="px-3 py-2">{r.total_revenue}</td>
                </tr>
              ))}
              {!daily?.length && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-3 text-center text-gray-500"
                  >
                    No data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">By City</h2>
          <div className="overflow-x-auto rounded border bg-white">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2">City</th>
                  <th className="px-3 py-2">Bookings</th>
                  <th className="px-3 py-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {byCity?.map((r: any) => (
                  <tr key={r.city_key} className="border-t">
                    <td className="px-3 py-2">{r.city || "—"}</td>
                    <td className="px-3 py-2">{r.total_bookings}</td>
                    <td className="px-3 py-2">{r.total_revenue}</td>
                  </tr>
                ))}
                {!byCity?.length && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-3 text-center text-gray-500"
                    >
                      No data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold">By Status</h2>
          <div className="overflow-x-auto rounded border bg-white">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Bookings</th>
                  <th className="px-3 py-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {byStatus?.map((r: any) => (
                  <tr key={r.status_key} className="border-t">
                    <td className="px-3 py-2">{r.status || "—"}</td>
                    <td className="px-3 py-2">{r.total_bookings}</td>
                    <td className="px-3 py-2">{r.total_revenue}</td>
                  </tr>
                ))}
                {!byStatus?.length && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-3 text-center text-gray-500"
                    >
                      No data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">By Vehicle Class</h2>
        <div className="overflow-x-auto rounded border bg-white">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2">Vehicle class</th>
                <th className="px-3 py-2">Bookings</th>
                <th className="px-3 py-2">Pax</th>
                <th className="px-3 py-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {byVehicle?.map((r: any) => (
                <tr key={r.vehicle_key} className="border-t">
                  <td className="px-3 py-2">{r.vehicle_class || "—"}</td>
                  <td className="px-3 py-2">{r.total_bookings}</td>
                  <td className="px-3 py-2">{r.total_pax}</td>
                  <td className="px-3 py-2">{r.total_revenue}</td>
                </tr>
              ))}
              {!byVehicle?.length && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-3 text-center text-gray-500"
                  >
                    No data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
