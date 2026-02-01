import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

export const dynamic = "force-dynamic";
export default async function HotelPropertiesPage() {
  const { data, error } = await supabase
    .from("hotel_properties")
    .select("*")
    .order("city")
    .order("name");

  const rows = (data as any[]) || [];

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Hotel Properties</h1>
        <a
          href="/hotels/properties/new"
          className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
        >
          + New Hotel
        </a>
      </div>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          Error loading hotels: {error.message}
        </div>
      )}

      <div className="overflow-x-auto rounded border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-600">
            <tr>
              <th className="px-3 py-2">City</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Chain</th>
              <th className="px-3 py-2">Stars</th>
              <th className="px-3 py-2">Address</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => (
              <tr key={h.id} className="border-t">
                <td className="px-3 py-2 text-xs">{h.city}</td>
                <td className="px-3 py-2">{h.name}</td>
                <td className="px-3 py-2 text-xs">{h.chain || "-"}</td>
                <td className="px-3 py-2 text-xs">{h.star_rating ?? "-"}</td>
                <td className="px-3 py-2 text-xs">
                  {h.address ? h.address.slice(0, 60) : "-"}
                </td>
              </tr>
            ))}

            {!rows.length && !error && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-4 text-center text-xs text-gray-500"
                >
                  No hotels yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
