import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PackageFlightsPage({ params }: any) {
  const { id } = params;

  const { data: pkg } = await supabase
    .from("umrah_packages")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!pkg) return notFound();

  const { data } = await supabase
    .from("umrah_package_flights")
    .select(
      `
      id,
      sort_order,
      notes,
      flight:segment_id ( id, airline, flight_no, from_city, to_city )
    `
    )
    .eq("package_id", id)
    .order("sort_order");

  const items = data || [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <Link href={`/umrah/packages/${id}`} className="text-blue-600 text-sm">
        &larr; Back
      </Link>

      <div className="flex justify-between">
        <h1 className="text-xl font-bold">
          Flights for package: {pkg.name}
        </h1>

        <Link
          href={`/umrah/packages/${id}/flights/new`}
          className="bg-black text-white px-3 py-2 text-sm rounded"
        >
          + Add flight
        </Link>
      </div>

      <div className="border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2">Airline</th>
              <th className="px-3 py-2">Flight No</th>
              <th className="px-3 py-2">Route</th>
              <th className="px-3 py-2">Sort</th>
              <th className="px-3 py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center">
                  No flights linked yet.
                </td>
              </tr>
            )}

            {items.map((i: any) => (
              <tr key={i.id} className="border-t">
                <td className="px-3 py-2">{i.flight.airline}</td>
                <td className="px-3 py-2">{i.flight.flight_no}</td>
                <td className="px-3 py-2">
                  {i.flight.from_city} → {i.flight.to_city}
                </td>
                <td className="px-3 py-2">{i.sort_order}</td>
                <td className="px-3 py-2">{i.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
