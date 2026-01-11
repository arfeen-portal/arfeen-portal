// src/app/transport/vehicles/page.tsx

import { supabase } from "@/lib/supabaseClient";
export const dynamic = "force-dynamic";
export const revalidate = 0;
type Vehicle = {
  id: string;
  name: string;
  vehicle_class: string | null;
  plate_number: string | null;
  capacity: number | null;
  is_active: boolean;
};

export default async function VehiclesPage() {
  const { data: vehicles, error } = await supabase
    .from("transport_vehicles")
    .select("*")
    .order("name", { ascending: true });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Vehicles</h1>

        {/* future: yahan New Vehicle form ka link ayega */}
        <button
          type="button"
          className="rounded border bg-white px-3 py-1.5 text-sm shadow-sm text-gray-500 cursor-default"
          title="Coming soon"
        >
          + New Vehicle (coming soon)
        </button>
      </div>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          Error loading vehicles: {error.message}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs font-semibold uppercase text-gray-600">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Class</th>
              <th className="px-3 py-2">Plate</th>
              <th className="px-3 py-2">Capacity</th>
              <th className="px-3 py-2">Active</th>
            </tr>
          </thead>
          <tbody>
            {vehicles?.map((v: Vehicle) => (
              <tr key={v.id} className="border-b last:border-b-0">
                <td className="px-3 py-2">{v.name}</td>
                <td className="px-3 py-2">{v.vehicle_class || "-"}</td>
                <td className="px-3 py-2">{v.plate_number || "-"}</td>
                <td className="px-3 py-2">{v.capacity ?? "-"}</td>
                <td className="px-3 py-2 text-xs">
                  {v.is_active ? (
                    <span className="inline-flex rounded-full border border-green-500 bg-green-50 px-2 py-0.5 text-[11px] text-green-700">
                      active
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full border border-gray-400 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600">
                      inactive
                    </span>
                  )}
                </td>
              </tr>
            ))}

            {!vehicles?.length && !error && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-4 text-center text-xs text-gray-500"
                >
                  No vehicles found yet (seed rows bhi delete ho gayi hongi ya
                  abhi tak add nahi ki).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
