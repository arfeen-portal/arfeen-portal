'use client';

import { useEffect, useState } from 'react';

type Alert = { id: string; title: string; severity: string; country_code?: string };
type Insight = {
  place_id: string;
  insight_type: string;
  payload: { score?: number; label?: string };
};

export default function WorldIntelligencePage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    const load = async () => {
      const [aRes, iRes] = await Promise.all([
        fetch('/api/risk-alerts'),
        fetch('/api/intelligence/latest-insights'),
      ]);

      if (aRes.ok) {
        const aj = await aRes.json();
        setAlerts(aj.alerts || []);
      }
      if (iRes.ok) {
        const ij = await iRes.json();
        setInsights(ij.insights || []);
      }
    };
    load();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">World Travel Intelligence</h1>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Active Risk Alerts</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {alerts.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-lg shadow-sm px-3 py-2 text-xs"
            >
              <div className="flex justify-between items-center gap-2">
                <span className="font-semibold">{a.title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                  {a.severity.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Latest Place Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {insights.map((i, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg shadow-sm px-3 py-2 text-xs"
            >
              <div className="font-semibold">
                {i.insight_type.replace('_', ' ').toUpperCase()}
              </div>
              <div className="text-gray-600">
                Score: {i.payload?.score ?? '—'} • {i.payload?.label ?? ''}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
