'use client';

import { useEffect, useState } from 'react';

type Alert = {
  id: string;
  title: string;
  message: string;
  category: string;
  severity: string;
  valid_from: string;
  valid_to: string | null;
  country_code: string | null;
};

export default function RiskAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/risk-alerts');
        const json = await res.json();
        if (res.ok) setAlerts(json.alerts || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="p-6 text-sm">Loading risk alerts…</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Global Risk Alerts</h1>

      {alerts.length === 0 && (
        <p className="text-xs text-gray-500">No active alerts.</p>
      )}

      <div className="space-y-3">
        {alerts.map((a) => (
          <div
            key={a.id}
            className="bg-white rounded-lg shadow-sm p-4 border border-gray-100"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">{a.title}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                {a.severity.toUpperCase()} / {a.category}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">{a.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
