'use client';

import { useEffect, useState } from 'react';

type LocationRow = {
  id: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  battery: number | null;
  created_at: string;
  family_member: {
    id: string;
    member_name: string;
    relation: string | null;
  };
};

export default function TripLivePage({
  params,
}: {
  params: { tripId: string };
}) {
  const { tripId } = params;
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = async () => {
    try {
      const res = await fetch(
        `/api/locator/location/list?tripId=${tripId}`,
        { cache: 'no-store' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setLocations(data.locations || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
      <h1 className="text-2xl font-bold mb-2">Live Trip View</h1>
      <p className="text-sm text-gray-600 mb-4">
        Trip ID: <span className="font-mono">{tripId}</span>
      </p>

      {error && (
        <div className="border border-red-300 bg-red-50 text-sm p-2 rounded">
          Error: {error}
        </div>
      )}

      {loading && <div className="text-sm text-gray-600">Loading...</div>}

      {/* Placeholder for future map */}
      <div className="w-full h-64 border rounded flex items-center justify-center text-gray-400 text-sm mb-4">
        Map placeholder (later: Google/Mapbox integration)
      </div>

      <div className="border rounded overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">Member</th>
              <th className="px-3 py-2 text-left">Relation</th>
              <th className="px-3 py-2 text-left">Lat</th>
              <th className="px-3 py-2 text-left">Lng</th>
              <th className="px-3 py-2 text-left">Battery</th>
              <th className="px-3 py-2 text-left">Last updated</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((loc) => (
              <tr key={loc.id} className="border-t">
                <td className="px-3 py-2">
                  {loc.family_member?.member_name || '—'}
                </td>
                <td className="px-3 py-2">
                  {loc.family_member?.relation || '—'}
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {loc.lat.toFixed(5)}
                </td>
                <td className="px-3 py-2 font-mono text-xs">
                  {loc.lng.toFixed(5)}
                </td>
                <td className="px-3 py-2">
                  {loc.battery != null ? `${loc.battery}%` : '—'}
                </td>
                <td className="px-3 py-2 text-xs text-gray-600">
                  {new Date(loc.created_at).toLocaleString()}
                </td>
              </tr>
            ))}

            {!loading && locations.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-4 text-center text-gray-500 text-sm"
                >
                  No locations yet. Start sending locations from the mobile
                  app.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
