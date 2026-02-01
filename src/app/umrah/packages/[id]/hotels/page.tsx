import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PackageHotels({ params }: any) {
  const { id } = params;

  const { data: pkg } = await supabase
    .from("umrah_packages")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!pkg) return notFound();

  const { data } = await supabase
    .from("umrah_package_hotels")
    .select(
      `
      id,
      nights,
      price_per_night,
      sort_order,
      notes,
      hotel:hotel_id ( id, name, city )
    `
    )
    .eq("package_id", id)
    .order("sort_order");

  const hotels = data || [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <Link href={`/umrah/packages/${id}`} className="text-blue-600 text-sm">
        &larr; Back
      </Link>

      <div className="flex justify-between">
        <h1 className="text-xl font-bold">
          Hotels for package: {pkg.name}
        </h1>

        <Link
          href={`/umrah/packages/${id}/hotels/new`}
          className="bg-black text-white px-3 py-2 text-sm rounded"
        >
          + Add hotel
        </Link>
      </div>

      <div className="border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2">Hotel</th>
              <th className="px-3 py-2">City</th>
              <th className="px-3 py-2">Nights</th>
              <th className="px-3 py-2">Rate</th>
              <th className="px-3 py-2">Sort</th>
              <th className="px-3 py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {hotels.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center">
                  No hotels linked.
                </td>
              </tr>
            )}

            {hotels.map((h: any) => (
              <tr key={h.id} className="border-t">
                <td className="px-3 py-2">{h.hotel?.name}</td>
                <td className="px-3 py-2">{h.hotel?.city}</td>
                <td className="px-3 py-2">{h.nights}</td>
                <td className="px-3 py-2">{h.price_per_night || "-"}</td>
                <td className="px-3 py-2">{h.sort_order}</td>
                <td className="px-3 py-2">{h.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
