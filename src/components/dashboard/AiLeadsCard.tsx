'use client';

import { useEffect, useState } from 'react';

type Lead = {
  id: number;
  customer_name: string;
  customer_phone: string;
  created_at: string;
  source: string;
  total_price: number;
};

export default function AiLeadsCard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/ai/leads');
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed');
        setLeads(data.leads || []);
      } catch (e: any) {
        setError(e.message || 'Error');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">AI Leads (Last 10)</h3>
        {loading && (
          <span className="text-[11px] text-gray-400">Loading…</span>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 mb-2">{error}</p>
      )}

      {leads.length === 0 && !loading && (
        <p className="text-xs text-gray-500">
          Abhi tak koi AI planner / public landing se lead nahi aayi.
        </p>
      )}

      {leads.length > 0 && (
        <div className="mt-2 overflow-auto">
          <table className="min-w-full text-[11px]">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1 pr-2">Name</th>
                <th className="text-left py-1 pr-2">Phone</th>
                <th className="text-left py-1 pr-2">Source</th>
                <th className="text-left py-1 pr-2">Amount</th>
                <th className="text-left py-1 pr-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="py-1 pr-2">{l.customer_name}</td>
                  <td className="py-1 pr-2">{l.customer_phone}</td>
                  <td className="py-1 pr-2 text-gray-500">
                    {l.source}
                  </td>
                  <td className="py-1 pr-2">
                    {l.total_price?.toLocaleString?.() || '-'}
                  </td>
                  <td className="py-1 pr-2 text-gray-500">
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
