'use client';

import { useEffect, useState } from 'react';

type Summary = {
  totalUnpaid: number;
  totalOverdue: number;
  thisMonthCollected: number;
  upcomingCount: number;
};

export default function BillingOverviewPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/billing/summary');
        const data = await res.json();
        if (res.ok) setSummary(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="px-4 py-6 lg:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Billing Overview
        </h1>
        <p className="text-sm text-slate-500">
          Quick snapshot for recovery & finance.
        </p>
      </div>

      {loading || !summary ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            title="Total Unpaid"
            value={summary.totalUnpaid.toFixed(2)}
            color="text-amber-700 bg-amber-50 border-amber-200"
          />
          <Card
            title="Total Overdue"
            value={summary.totalOverdue.toFixed(2)}
            color="text-rose-700 bg-rose-50 border-rose-200"
          />
          <Card
            title="Collected This Month"
            value={summary.thisMonthCollected.toFixed(2)}
            color="text-emerald-700 bg-emerald-50 border-emerald-200"
          />
          <Card
            title="Due in next 7 days"
            value={String(summary.upcomingCount)}
            color="text-sky-700 bg-sky-50 border-sky-200"
          />
        </div>
      )}
    </div>
  );
}

function Card({
  title,
  value,
  color
}: {
  title: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-sm flex flex-col justify-between ${color}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
        {title}
      </p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
