import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

export default async function ResultsPage({ searchParams }: any) {
  const { from, to, date, pax } = searchParams;

  // Call backend API route
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/live-tickets/api/search?from=${from}&to=${to}&date=${date}&pax=${pax}`
  );

  const flights = await res.json();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold">Results</h1>

      <div className="text-sm text-gray-600">
        From {from} → {to} on {date} | {pax} Pax
      </div>

      <div className="border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2">Airline</th>
              <th className="px-3 py-2">Flight</th>
              <th className="px-3 py-2">Depart</th>
              <th className="px-3 py-2">Arrive</th>
              <th className="px-3 py-2">Stops</th>
              <th className="px-3 py-2">Price</th>
            </tr>
          </thead>

          <tbody>
            {flights?.map((f: any) => (
              <tr key={f.id} className="border-t">
                <td className="px-3 py-2">{f.airline}</td>
                <td className="px-3 py-2">{f.flight_no}</td>
                <td className="px-3 py-2">{f.depart_time}</td>
                <td className="px-3 py-2">{f.arrive_time}</td>
                <td className="px-3 py-2">{f.stops}</td>
                <td className="px-3 py-2 font-semibold">
                  {f.currency} {f.price}
                </td>
              </tr>
            ))}

            {(!flights || flights.length === 0) && (
              <tr>
                <td colSpan={6} className="text-center p-4 text-gray-500">
                  No live flights found.
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
}
