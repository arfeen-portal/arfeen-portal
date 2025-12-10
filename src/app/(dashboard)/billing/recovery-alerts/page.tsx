'use client';

import { useEffect, useState } from 'react';

type Alert = {
  agent_id: string;
  agent_name: string;
  phone: string | null;
  invoice_id: string;
  booking_reference: string | null;
  total_billing: number;
  billing_currency: string;
  service_date: string;
  due_date: string | null;
};

export default function RecoveryAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/billing/recovery-alerts');
        const data = await res.json();
        if (res.ok) setAlerts(data.alerts || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="px-4 py-6 lg:px-6 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Recovery Alerts (Tomorrow&apos;s Last Bookings)
          </h1>
          <p className="text-sm text-slate-500">
            Ye list un agents ki hai jinki kal last booking hai aur payment
            abhi pending (invoice paid nahi).
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading alerts...</p>
      ) : alerts.length === 0 ? (
        <p className="text-sm text-emerald-700">
          Aaj ke liye koi recovery alert nahi – sab safe 🚀
        </p>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Agent
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Contact
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Booking Ref
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Service Date (Tomorrow)
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Invoice Amount
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">
                  Invoice Due
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {alerts.map((a) => (
                <tr key={`${a.agent_id}-${a.invoice_id}`}>
                  <td className="px-4 py-3 text-sm text-slate-800">
                    {a.agent_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {a.phone ? (
                      <a
                        href={`https://wa.me/${a.phone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-700 hover:underline"
                      >
                        {a.phone}
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {a.booking_reference || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {a.service_date
                      ? new Date(a.service_date).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900 font-semibold">
                    {Number(a.total_billing || 0).toFixed(2)}{' '}
                    <span className="text-xs text-slate-500">
                      {a.billing_currency}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {a.due_date
                      ? new Date(a.due_date).toLocaleDateString()
                      : '-'}
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
