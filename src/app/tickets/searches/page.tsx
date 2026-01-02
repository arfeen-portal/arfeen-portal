import { supabase } from "@/lib/supabaseClient";
export const dynamic = "force-dynamic";
export default async function FlightSearchesPage() {
  const { data, error } = await supabase
    .from("flight_search_sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (data as any[]) || [];

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Flight Searches</h1>
        <a
          href="/tickets/searches/new"
          className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
        >
          + New Search
        </a>
      </div>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          Error loading searches: {error.message}
        </div>
      )}

      <div className="overflow-x-auto rounded border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-600">
            <tr>
              <th className="px-3 py-2">Route</th>
              <th className="px-3 py-2">Depart</th>
              <th className="px-3 py-2">Return</th>
              <th className="px-3 py-2">Pax</th>
              <th className="px-3 py-2">Class</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-3 py-2 text-xs">
                  {s.origin} → {s.destination}
                </td>
                <td className="px-3 py-2 text-xs">{s.depart_date}</td>
                <td className="px-3 py-2 text-xs">{s.return_date || "-"}</td>
                <td className="px-3 py-2 text-xs">
                  A{s.adults} C{s.children} I{s.infants}
                </td>
                <td className="px-3 py-2 text-xs">
                  {s.cabin_class || "-"}
                </td>
                <td className="px-3 py-2 text-xs">{s.created_at}</td>
              </tr>
            ))}

            {!rows.length && !error && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-4 text-center text-xs text-gray-500"
                >
                  No searches yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
