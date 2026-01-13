// app/(dashboard)/groups/[groupId]/safety-dashboard/page.tsx

import { createClient } from "@supabase/supabase-js";

type PageProps = {
  params: { groupId: string };
};

export default async function SafetyDashboardPage({ params }: PageProps) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // ✅ BUILD-TIME SAFETY (MOST IMPORTANT RULE)
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  // ✅ Supabase client FUNCTION ke andar (never top-level)
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  /* -----------------------------
     LOST & FOUND EVENTS
  ------------------------------ */
  const { data: lostFound } = await supabase
    .from("lost_found_events")
    .select(`
      id,
      status,
      last_seen_place,
      last_seen_at,
      pilgrim_profiles (
        full_name
      )
    `)
    .eq("group_trip_id", params.groupId)
    .in("status", ["lost", "found"]);

  /* -----------------------------
     HEALTH ALERTS
  ------------------------------ */
  const { data: alerts } = await supabase
    .from("health_alerts")
    .select(`
      id,
      alert_type,
      severity,
      message,
      created_at,
      pilgrim_profiles (
        full_name
      )
    `)
    .eq("group_trip_id", params.groupId)
    .is("resolved_at", null);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Group Safety Dashboard</h1>

      {/* LOST & FOUND */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="px-4 py-2 border-b font-semibold">
          Lost & Found
        </div>

        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Pilgrim</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Last Seen</th>
              <th className="px-3 py-2 text-left">Time</th>
            </tr>
          </thead>

          <tbody>
            {lostFound && lostFound.length > 0 ? (
              lostFound.map((row: any) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2">
                    {row.pilgrim_profiles?.full_name ?? "-"}
                  </td>
                  <td className="px-3 py-2 capitalize">
                    {row.status}
                  </td>
                  <td className="px-3 py-2">
                    {row.last_seen_place ?? "-"}
                  </td>
                  <td className="px-3 py-2">
                    {row.last_seen_at
                      ? new Date(row.last_seen_at).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-gray-500">
                  No active lost/found cases.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* HEALTH ALERTS */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="px-4 py-2 border-b font-semibold">
          Health Alerts
        </div>

        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">Pilgrim</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Severity</th>
              <th className="px-3 py-2 text-left">Message</th>
              <th className="px-3 py-2 text-left">Time</th>
            </tr>
          </thead>

          <tbody>
            {alerts && alerts.length > 0 ? (
              alerts.map((row: any) => (
                <tr key={row.id} className="border-t">
                  <td className="px-3 py-2">
                    {row.pilgrim_profiles?.full_name ?? "-"}
                  </td>
                  <td className="px-3 py-2 capitalize">
                    {row.alert_type}
                  </td>
                  <td className="px-3 py-2">
                    {row.severity}
                  </td>
                  <td className="px-3 py-2">
                    {row.message}
                  </td>
                  <td className="px-3 py-2">
                    {row.created_at
                      ? new Date(row.created_at).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-gray-500">
                  No active alerts.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
