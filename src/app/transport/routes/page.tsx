// src/app/transport/routes/page.tsx

import { supabase } from "@/lib/supabaseClient";
export const dynamic = "force-dynamic";
type RouteRow = {
  id: string;
  route_name: string;
  origin_city: string;
  origin_type: string;
  origin_location: string | null;
  destination_city: string;
  destination_type: string;
  destination_location: string | null;
  currency: string;
  base_price: number | null;
  is_active: boolean;
};

export default async function RoutesPage() {
  const { data: routes, error } = await supabase
    .from("transport_routes")
    .select("*")
    .order("route_name", { ascending: true });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Transport Routes</h1>

        <button
          type="button"
          className="rounded border bg-white px-3 py-1.5 text-sm shadow-sm text-gray-500 cursor-default"
          title="Coming soon"
        >
          + New Route (coming soon)
        </button>
      </div>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          Error loading routes: {error.message}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs font-semibold uppercase text-gray-600">
            <tr>
              <th className="px-3 py-2">Route</th>
              <th className="px-3 py-2">From</th>
              <th className="px-3 py-2">To</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Active</th>
            </tr>
          </thead>
          <tbody>
            {routes?.map((r: RouteRow) => (
              <tr key={r.id} className="border-b last:border-b-0">
                <td className="px-3 py-2">{r.route_name}</td>
                <td className="px-3 py-2">
                  {r.origin_city} ({r.origin_type}){" "}
                  {r.origin_location ? `– ${r.origin_location}` : ""}
                </td>
                <td className="px-3 py-2">
                  {r.destination_city} ({r.destination_type}){" "}
                  {r.destination_location ? `– ${r.destination_location}` : ""}
                </td>
                <td className="px-3 py-2">
                  {r.currency} {r.base_price ?? "-"}
                </td>
                <td className="px-3 py-2 text-xs">
                  {r.is_active ? (
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

            {!routes?.length && !error && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-4 text-center text-xs text-gray-500"
                >
                  No routes found yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
