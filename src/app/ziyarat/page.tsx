'use client';

import { useEffect, useState } from 'react';

type Shrine = {
  id: string;
  name_default: string;
  city: string | null;
  country_code: string;
};

export default function ZiyaratPage() {
  const [shrines, setShrines] = useState<Shrine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/ziyarat/shrines');
        const json = await res.json();
        if (res.ok) setShrines(json.shrines || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Ziyarat Planner</h1>
      <p className="text-xs text-gray-500">
        Najaf, Karbala, Mashhad, Qom, Madinah etc. ke shrines ko AI-based planner
        ke sath connect karenge.
      </p>

      {loading && <p className="text-sm">Loading shrines…</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {shrines.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-lg shadow-sm px-3 py-2 text-xs"
          >
            <div className="font-semibold">{s.name_default}</div>
            <div className="text-gray-500">
              {s.city} • {s.country_code}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
