import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PackageTransportsPage({ params }: any) {
  const { id } = params;

  const { data: pkg, error: pkgError } = await supabase
    .from("umrah_packages")
    .select("id, name")
    .eq("id", id)
    .single();

  if (pkgError || !pkg) {
    return notFound();
  }

  const { data: rows } = await supabase
    .from("umrah_package_transports")
    .select(
      `
      id,
      direction,
      sort_order,
      notes,
      transport_routes:route_id ( id, from_city, to_city, price )
    `
    )
    .eq("package_id", id)
    .order("sort_order", { ascending: true });

  const links = rows || [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <Link href={`/umrah/packages/${id}`} className="text-blue-600 text-sm">
        &larr; Back to package
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">
          Transports for package: {pkg.name}
        </h1>
        <Link
          href={`/umrah/packages/${id}/transports/new`}
          className="px-3 py-2 text-sm rounded bg-black text-white hover:bg-gray-800"
        >
          + Add transport
        </Link>
      </div>

      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2">Route</th>
              <th className="px-3 py-2">Direction</th>
              <th className="px-3 py-2">Price</th>
              <th className="px-3 py-2">Sort</th>
              <th className="px-3 py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {links.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-4 text-center text-gray-500"
                >
                  No transports linked yet.
                </td>
              </tr>
            )}

            {links.map((row: any) => (
              <tr key={row.id} className="border-t">
                <td className="px-3 py-2">
                  {row.transport_routes
                    ? `${row.transport_routes.from_city} → ${row.transport_routes.to_city}`
                    : row.route_id}
                </td>
                <td className="px-3 py-2">{row.direction}</td>
                <td className="px-3 py-2">
                  {row.transport_routes?.price ?? "-"}
                </td>
                <td className="px-3 py-2">{row.sort_order}</td>
                <td className="px-3 py-2 text-xs text-gray-600">
                  {row.notes || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
