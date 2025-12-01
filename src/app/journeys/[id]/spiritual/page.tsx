'use client';

import { useEffect, useState } from 'react';

type SummaryRow = {
  activity_key: string;
  total_quantity: number;
};

export default function SpiritualSummaryPage({
  params,
}: {
  params: { id: string };
}) {
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `/api/journeys/${params.id}/spiritual-summary`
        );
        const json = await res.json();
        if (res.ok) setRows(json.summary ?? []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  if (loading) return <div className="p-6 text-sm">Loading…</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">
        Spiritual Journey Summary
      </h1>

      {rows.length === 0 && (
        <p className="text-xs text-gray-500">
          No activities logged yet.
        </p>
      )}

      {rows.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-2 py-2 text-left">Activity</th>
                <th className="px-2 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.activity_key} className="border-b last:border-0">
                  <td className="px-2 py-2">
                    {r.activity_key.toUpperCase()}
                  </td>
                  <td className="px-2 py-2 text-right">
                    {r.total_quantity}
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
