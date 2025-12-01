'use client';

import { useEffect, useState } from 'react';

type Metric = {
  metric_type: string;
  metric_value: number;
  measured_at: string;
  meta?: any;
};

type LiveResponse = {
  place: {
    id: string;
    name_default: string;
    city: string | null;
    country_code: string;
  };
  metrics: Record<string, Metric>;
};

export default function LivePlacePage({
  params,
}: {
  params: { slug: string };
}) {
  const [data, setData] = useState<LiveResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/places/${params.slug}/live-metrics`);
        const json = await res.json();
        if (res.ok) setData(json);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.slug]);

  if (loading) return <div className="p-6 text-sm">Loading…</div>;
  if (!data)
    return (
      <div className="p-6 text-sm text-red-600">
        No data available.
      </div>
    );

  const { place, metrics } = data;

  const crowd = metrics['crowd_level']?.metric_value ?? null;
  const wait = metrics['waiting_minutes']?.metric_value ?? null;
  const ac = metrics['ac_intensity']?.metric_value ?? null;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">
        Live Status – {place.name_default}
      </h1>
      <p className="text-xs text-gray-500">
        {place.city} – {place.country_code}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-gray-500">Crowd Level</p>
          <p className="text-2xl font-bold">
            {crowd !== null ? `${crowd.toFixed(0)} / 100` : 'N/A'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-gray-500">Waiting Time</p>
          <p className="text-2xl font-bold">
            {wait !== null ? `${wait.toFixed(0)} min` : 'N/A'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-gray-500">AC / Comfort</p>
          <p className="text-2xl font-bold">
            {ac !== null ? `${ac.toFixed(0)} / 100` : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}
