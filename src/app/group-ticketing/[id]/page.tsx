'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type BatchRow = {
  id: string;
  name: string;
  airline?: string | null;
  sector?: string | null;
  travel_date?: string | null;
  notes?: string | null;
};

type BookingRow = {
  id: string;
  batch_id: string;
  agent_name?: string | null;
  passengers?: number | null;
  cost_per_ticket?: number | null;
  sell_price_per_ticket?: number | null;
  total_cost?: number | null;
  total_sell?: number | null;
};

export default function GroupTicketBatchDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [batch, setBatch] = useState<BatchRow | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadAll() {
      setLoading(true);

      const [batchRes, bookingsRes] = await Promise.all([
        supabase.from('group_ticket_batches').select('*').eq('id', params.id).single(),
        supabase
          .from('group_ticket_bookings')
          .select('*')
          .eq('batch_id', params.id)
          .order('created_at', { ascending: true }),
      ]);

      if (batchRes.error) {
        console.error('Error loading batch:', batchRes.error);
      }

      if (bookingsRes.error) {
        console.error('Error loading batch bookings:', bookingsRes.error);
      }

      if (isMounted) {
        setBatch((batchRes.data as BatchRow) ?? null);
        setBookings((bookingsRes.data as BookingRow[]) ?? []);
        setLoading(false);
      }
    }

    loadAll();
    return () => {
      isMounted = false;
    };
  }, [params.id]);

  const totals = useMemo(() => {
    let totalPax = 0;
    let totalCost = 0;
    let totalSell = 0;

    for (const b of bookings) {
      const pax = Number(b.passengers ?? 0);
      totalPax += pax;
      totalCost += Number(b.total_cost ?? pax * (b.cost_per_ticket ?? 0));
      totalSell += Number(b.total_sell ?? pax * (b.sell_price_per_ticket ?? 0));
    }

    return {
      totalPax,
      totalCost,
      totalSell,
      profit: totalSell - totalCost,
    };
  }, [bookings]);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Loading batch details…</p>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm text-red-600">Batch not found.</p>
        <button
          onClick={() => router.push('/group-ticketing')}
          className="text-xs underline"
        >
          Back to batches
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{batch.name}</h1>
          <p className="text-xs text-gray-500">
            {batch.airline || '—'} · {batch.sector || '—'} ·{' '}
            {batch.travel_date ? batch.travel_date : 'Date TBD'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/group-ticketing/${batch.id}/bookings/new`}
            className="px-3 py-2 rounded bg-black text-white text-xs"
          >
            + Add booking
          </Link>
          <Link
            href="/group-ticketing"
            className="text-xs underline text-gray-600"
          >
            Back to all batches
          </Link>
        </div>
      </div>

      {/* Summary */}
      <div className="grid md:grid-cols-4 gap-4 text-sm">
        <div className="border rounded-lg p-3 bg-gray-50">
          <div className="text-[11px] text-gray-500">Total passengers</div>
          <div className="text-lg font-semibold">{totals.totalPax}</div>
        </div>

        <div className="border rounded-lg p-3 bg-gray-50">
          <div className="text-[11px] text-gray-500">Total cost</div>
          <div className="text-lg font-semibold">
            SAR {totals.totalCost.toFixed(0)}
          </div>
        </div>

        <div className="border rounded-lg p-3 bg-gray-50">
          <div className="text-[11px] text-gray-500">Total sell</div>
          <div className="text-lg font-semibold">
            SAR {totals.totalSell.toFixed(0)}
          </div>
        </div>

        <div className="border rounded-lg p-3 bg-gray-50">
          <div className="text-[11px] text-gray-500">Estimated profit</div>
          <div
            className={`text-lg font-semibold ${
              totals.profit >= 0 ? 'text-green-700' : 'text-red-600'
            }`}
          >
            SAR {totals.profit.toFixed(0)}
          </div>
        </div>
      </div>

      {/* Bookings table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Agent</th>
              <th className="px-3 py-2 text-right font-medium">Passengers</th>
              <th className="px-3 py-2 text-right font-medium">
                Cost / ticket
              </th>
              <th className="px-3 py-2 text-right font-medium">
                Sell / ticket
              </th>
              <th className="px-3 py-2 text-right font-medium">Total cost</th>
              <th className="px-3 py-2 text-right font-medium">Total sell</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-4 text-center text-gray-400"
                >
                  No bookings added yet.
                </td>
              </tr>
            ) : (
              bookings.map((b) => {
                const pax = Number(b.passengers ?? 0);
                const cost =
                  Number(b.total_cost) ||
                  pax * Number(b.cost_per_ticket ?? 0);
                const sell =
                  Number(b.total_sell) || pax * Number(b.sell_price_per_ticket ?? 0);

                return (
                  <tr key={b.id} className="border-t">
                    <td className="px-3 py-2">{b.agent_name || '—'}</td>
                    <td className="px-3 py-2 text-right">{pax}</td>
                    <td className="px-3 py-2 text-right">
                      {b.cost_per_ticket ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {b.sell_price_per_ticket ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {cost ? `SAR ${cost.toFixed(0)}` : '—'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {sell ? `SAR ${sell.toFixed(0)}` : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

