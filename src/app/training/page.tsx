'use client';

import { useEffect, useState } from 'react';

type Module = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  level: string | null;
  tags: string[] | null;
};

export default function TrainingPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/training/modules');
        const json = await res.json();
        if (res.ok) setModules(json.modules || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="p-6 text-sm">Loading training…</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Umrah Business Classroom</h1>
      <p className="text-xs text-gray-500">
        Agents ke liye training modules – sales, pricing, operations, etc.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((m) => (
          <div
            key={m.id}
            className="bg-white rounded-lg shadow-sm p-4 space-y-2"
          >
            <h2 className="text-sm font-semibold">{m.title}</h2>
            {m.description && (
              <p className="text-xs text-gray-600">{m.description}</p>
            )}
            <div className="flex items-center justify-between text-[10px] mt-1">
              <span className="uppercase">{m.level || 'basic'}</span>
              <span>{(m.tags || []).join(' • ')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
