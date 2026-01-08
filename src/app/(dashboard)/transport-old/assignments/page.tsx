'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type AssignmentRow = {
  id: string;
  is_primary: boolean | null;
  start_date: string | null;
  end_date: string | null;
  transport_drivers?: { full_name: string | null }[] | null;
  transport_vehicles?: { name: string | null; vehicle_class: string | null }[] | null;
};

export default function AssignmentsPage() {
  const [rows, setRows] = useState<AssignmentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { data, error } = await supabase
        .from('transport_driver_vehicles')
        .select(`
          id,
          is_primary,
          start_date,
          end_date,
          transport_drivers ( full_name ),
          transport_vehicles ( name, vehicle_class )
        `)
        .order('start_date', { ascending: false });

      if (!mounted) return;

      if (error) {
        setError(error.message);
        setRows([]);
      } else {
        setRows((data as AssignmentRow[]) ?? []);
        setError(null);
      }

      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Driver – Vehicle Assignments</h1>

      {loading && (
        <p className="text-sm text-gray-500">Loading assignments…</p>
      )}

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          Error loading assignments: {error}
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-gray-50 font-semibold uppercase text-gray-600">
              <tr>
                <th className="px-3 py-2">Driver</th>
                <th className="px-3 py-2">Vehicle</th>
                <th className="px-3 py-2">Primary</th>
                <th className="px-3 py-2">Start</th>
                <th className="px-3 py-2">End</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-gray-400">
                    No assignments found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">
                      {r.transport_drivers?.[0]?.full_name ?? '-'}
                    </td>
                    <td className="px-3 py-2">
                      {r.transport_vehicles?.[0]
                        ? `${r.transport_vehicles[0].name} (${r.transport_vehicles[0].vehicle_class})`
                        : '-'}
                    </td>
                    <td className="px-3 py-2">
                      {r.is_primary ? 'Yes' : 'No'}
                    </td>
                    <td className="px-3 py-2">{r.start_date ?? '-'}</td>
                    <td className="px-3 py-2">{r.end_date ?? '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
