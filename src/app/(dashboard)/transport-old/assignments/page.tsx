'use client';
export const dynamic = 'force-dynamic';
import { supabaseClient as supabase } from '@/lib/supabaseClient';

type AssignmentRow = {
  id: string;
  is_primary: boolean | null;
  start_date: string | null;
  end_date: string | null;

  // Supabase nested relations usually come as arrays
  transport_drivers: { full_name: string | null }[] | null;
  transport_vehicles: { name: string | null; vehicle_class?: string | null }[] | null;
};

export default async function AssignmentsPage() {
  const { data, error } = await supabase
    .from("transport_driver_vehicles")
    .select(
      `
        id,
        is_primary,
        start_date,
        end_date,
        transport_drivers ( full_name ),
        transport_vehicles ( name, vehicle_class )
      `
    )
    .order("start_date", { ascending: false });

  const rows = ((data as unknown) as AssignmentRow[]) ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Driver - Vehicle Assignments</h1>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          Error loading assignments: {error.message}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs font-semibold uppercase">
            <tr>
              <th className="px-3 py-2">Driver</th>
              <th className="px-3 py-2">Vehicle</th>
              <th className="px-3 py-2">Primary</th>
              <th className="px-3 py-2">Start</th>
              <th className="px-3 py-2">End</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => {
              const driverName = r.transport_drivers?.[0]?.full_name ?? "-";
              const vehicleName = r.transport_vehicles?.[0]?.name ?? "-";
              const vehicleClass = r.transport_vehicles?.[0]?.vehicle_class ?? "";

              return (
                <tr key={r.id} className="border-b last:border-b-0">
                  <td className="px-3 py-2">{driverName}</td>

                  <td className="px-3 py-2">
                    {vehicleName}
                    {vehicleClass ? ` (${vehicleClass})` : ""}
                  </td>

                  <td className="px-3 py-2 text-xs">
                    {r.is_primary ? (
                      <span className="inline-flex rounded-full border px-2 py-0.5">
                        primary
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full border px-2 py-0.5">
                        secondary
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-2 text-xs">{r.start_date || "-"}</td>
                  <td className="px-3 py-2 text-xs">{r.end_date || "-"}</td>
                </tr>
              );
            })}

            {!rows.length && !error && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-4 text-center text-xs text-gray-500"
                >
                  No assignments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
