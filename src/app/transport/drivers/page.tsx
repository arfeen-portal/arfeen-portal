// src/app/transport/drivers/page.tsx

import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

export const dynamic = "force-dynamic";
export const revalidate = 0;
type Driver = {
  id: string;
  full_name: string;
  phone: string | null;
  whatsapp: string | null;
  license_number: string | null;
  is_active: boolean;
  notes: string | null;
};

export default async function DriversPage() {
  const { data: drivers, error } = await supabase
    .from("transport_drivers")
    .select("*")
    .order("full_name", { ascending: true });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Drivers</h1>

        <a
          href="/transport/drivers/new"
          className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900"
        >
          + New Driver
        </a>
      </div>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          Error loading drivers: {error.message}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs font-semibold uppercase text-gray-600">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">WhatsApp</th>
              <th className="px-3 py-2">License</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {drivers?.map((d: Driver) => (
              <tr key={d.id} className="border-b last:border-b-0 align-top">
                <td className="px-3 py-2">{d.full_name}</td>
                <td className="px-3 py-2">{d.phone || "-"}</td>
                <td className="px-3 py-2">{d.whatsapp || "-"}</td>
                <td className="px-3 py-2">{d.license_number || "-"}</td>
                <td className="px-3 py-2 text-xs">
                  {d.is_active ? (
                    <span className="inline-flex rounded-full border border-green-500 bg-green-50 px-2 py-0.5 text-[11px] text-green-700">
                      active
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full border border-gray-400 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-600">
                      inactive
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-gray-600">
                  {d.notes || "—"}
                </td>
              </tr>
            ))}

            {!drivers?.length && !error && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-4 text-center text-xs text-gray-500"
                >
                  No drivers found yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
