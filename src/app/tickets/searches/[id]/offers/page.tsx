import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();


export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

export default async function FlightOffersForSearchPage({ params }: PageProps) {
  const searchId = params.id;

  const { data: search, error: sError } = await supabase
    .from("flight_search_sessions")
    .select("id, origin, destination, depart_date, return_date")
    .eq("id", searchId)
    .single();

  if (sError || !search) {
    console.error(sError);
    notFound();
  }

  const { data: offers, error: oError } = await supabase
    .from("flight_offers")
    .select("*")
    .eq("search_id", searchId)
    .order("total_price", { ascending: true });

  const rows = offers || [];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/tickets/searches/${searchId}`}
            className="text-sm text-blue-600 underline"
          >
            ← Back to search
          </Link>
          <h1 className="text-xl font-semibold mt-2">
            Offers – {search.origin} → {search.destination}
          </h1>
          <p className="text-sm text-gray-600">
            {search.depart_date}{" "}
            {search.return_date ? ` / Return ${search.return_date}` : ""}
          </p>
        </div>
      </div>

      {oError && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          Error loading offers: {oError.message}
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">
          No offers logged for this search yet (API integration ke baad yahan
          data aaega).
        </p>
      ) : (
        <div className="overflow-x-auto rounded border bg-white">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 text-[11px] uppercase text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">Airline</th>
                <th className="px-3 py-2 text-left">Flight</th>
                <th className="px-3 py-2 text-left">Fare</th>
                <th className="px-3 py-2 text-left">Cabin</th>
                <th className="px-3 py-2 text-right">Total price</th>
                <th className="px-3 py-2 text-left">Currency</th>
                <th className="px-3 py-2 text-left">Logged at</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o: any) => (
                <tr key={o.id} className="border-t">
                  <td className="px-3 py-2">{o.airline || "—"}</td>
                  <td className="px-3 py-2">{o.flight_code || "—"}</td>
                  <td className="px-3 py-2">{o.fare_family || "—"}</td>
                  <td className="px-3 py-2">{o.cabin_class || "—"}</td>
                  <td className="px-3 py-2 text-right">
                    {o.total_price != null
                      ? `${o.currency || ""} ${o.total_price}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2">{o.currency || "—"}</td>
                  <td className="px-3 py-2">
                    {o.created_at
                      ? new Date(o.created_at).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
