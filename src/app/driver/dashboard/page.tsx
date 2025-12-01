import { createServerSupabaseClient } from "@/utils/supabase/server";

type Job = {
  id: string;
  trip_date: string | null;
  pickup_city: string | null;
  drop_city: string | null;
  vehicle_name: string | null;
  status: string | null;
};

export default async function DriverDashboardPage() {
  const supabase = createServerSupabaseClient();

  // RLS ke through future me sirf current driver ki jobs aayengi
  const { data: jobs, error } = await supabase
    .from("transport_bookings")
    .select(
      "id, trip_date, pickup_city, drop_city, vehicle_name, status"
    )
    .order("trip_date", { ascending: true })
    .limit(30);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Driver Dashboard</h1>
      <p className="text-sm text-gray-500">
        Assigned trips list (jab driver wali RLS final ho jayegi to yahan sirf
        current driver ka data aayega).
      </p>

      {error && (
        <p className="text-sm text-red-500">
          Error loading jobs: {error.message}
        </p>
      )}

      {(!jobs || jobs.length === 0) && !error && (
        <p className="text-sm text-gray-500">No jobs assigned.</p>
      )}

      {jobs && jobs.length > 0 && (
        <table className="min-w-full text-sm border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left border-b">Date</th>
              <th className="px-3 py-2 text-left border-b">From</th>
              <th className="px-3 py-2 text-left border-b">To</th>
              <th className="px-3 py-2 text-left border-b">Vehicle</th>
              <th className="px-3 py-2 text-left border-b">Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j: Job) => (
              <tr key={j.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 border-b">
                  {j.trip_date
                    ? new Date(j.trip_date).toLocaleString()
                    : "—"}
                </td>
                <td className="px-3 py-2 border-b">
                  {j.pickup_city ?? "—"}
                </td>
                <td className="px-3 py-2 border-b">
                  {j.drop_city ?? "—"}
                </td>
                <td className="px-3 py-2 border-b">
                  {j.vehicle_name ?? "—"}
                </td>
                <td className="px-3 py-2 border-b">{j.status ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
