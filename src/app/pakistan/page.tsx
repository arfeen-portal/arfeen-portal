'use client';

import { useEffect, useState } from 'react';

type Place = {
  id: string;
  name_default: string;
  place_type: string;
  region: string | null;
  city: string | null;
};

export default function PakistanTourismPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/pakistan/destinations');
        const json = await res.json();
        if (res.ok) setPlaces(json.places || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const grouped = places.reduce<Record<string, Place[]>>((acc, p) => {
    const key = p.region || p.city || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Pakistan Tourism Intelligence</h1>
      <p className="text-xs text-gray-500">
        Yahan se hum pure Pakistan ke destinations ko AI + live data ke sath connect karenge.
      </p>

      {loading && <p className="text-sm">Loading destinations…</p>}

      {!loading && Object.keys(grouped).length === 0 && (
        <p className="text-xs text-gray-500">Abhi PK ke places insert nahi hue.</p>
      )}

      <div className="space-y-4">
        {Object.entries(grouped).map(([region, items]) => (
          <div key={region}>
            <h2 className="text-sm font-semibold mb-2">{region}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {items.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-lg shadow-sm px-3 py-2 text-xs"
                >
                  <div className="font-medium">{p.name_default}</div>
                  <div className="text-gray-500">
                    {p.place_type} • {p.city || ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
