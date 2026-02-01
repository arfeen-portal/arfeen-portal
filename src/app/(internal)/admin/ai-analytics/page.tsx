'use client';

import { useEffect, useState } from 'react';

type AiStats = {
  totalPlans: number;
  totalSessions: number;
  aiBookings: number;
};

export default function AdminAiAnalyticsPage() {
  const [stats, setStats] = useState<AiStats | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/ai/analytics');
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed');
        setStats(data.stats);
        setPlans(data.lastPlans);
      } catch (e: any) {
        setError(e.message || 'Error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold">Admin – AI Analytics</h1>
      <p className="text-sm text-gray-500">
        Yahan se aap dekh sakte hain kitne AI plans, chats aur bookings
        generate ho rahi hain.
      </p>

      {loading && <p className="text-sm">Loading…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {stats && (
        <div className="grid md:grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500">Total AI Plans</div>
            <div className="text-2xl font-bold">{stats.totalPlans}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500">AI Chat Sessions</div>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-xs text-gray-500">AI-based Bookings</div>
            <div className="text-2xl font-bold">{stats.aiBookings}</div>
          </div>
        </div>
      )}

      {plans.length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="font-semibold text-sm mb-2">Last 10 AI Plans</h2>
          <div className="overflow-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-2">Date</th>
                  <th className="text-left py-2 pr-2">Budget</th>
                  <th className="text-left py-2 pr-2">Nights</th>
                  <th className="text-left py-2 pr-2">Hotel</th>
                  <th className="text-left py-2 pr-2">Transport</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-1 pr-2">
                      {new Date(p.created_at).toLocaleString()}
                    </td>
                    <td className="py-1 pr-2">
                      {p.generated_plan.summary.totalBudget} SAR
                    </td>
                    <td className="py-1 pr-2">
                      {p.generated_plan.summary.nights}
                    </td>
                    <td className="py-1 pr-2">
                      {p.generated_plan.summary.hotelCategory}
                    </td>
                    <td className="py-1 pr-2">
                      {p.generated_plan.summary.transport}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
