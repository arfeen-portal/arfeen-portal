'use client';

import { useEffect, useState } from 'react';

type RiskAlert = { id: string };

export default function DashboardPage() {
  const [alertsCount, setAlertsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/risk-alerts');
        const json = await res.json();
        if (res.ok) {
          setAlertsCount((json.alerts as RiskAlert[] | undefined)?.length || 0);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Arfeen Travel – Intelligence Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Risk Alerts"
          value={loading ? '…' : alertsCount.toString()}
          href="/risk-alerts"
        />
        <StatCard
          title="Spiritual Journeys"
          value="View"
          href="/journeys"
        />
        <StatCard
          title="Umrah AI Tools"
          value="Open"
          href="/tools/umrah"
        />
        <StatCard
          title="Pakistan Tourism"
          value="Explore"
          href="/pakistan"
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  href,
}: {
  title: string;
  value: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="bg-white rounded-xl shadow-sm px-4 py-3 flex flex-col justify-between hover:shadow-md transition"
    >
      <span className="text-xs text-gray-500">{title}</span>
      <span className="text-lg font-semibold mt-1">{value}</span>
    </a>
  );
}
