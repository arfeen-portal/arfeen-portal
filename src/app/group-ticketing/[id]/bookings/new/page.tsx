'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient} from '@/lib/supabaseClient';
const supabase = getSupabaseClient();
export const dynamic = "force-dynamic";
export default function NewGroupTicketBookingPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const batchId = params.id;

  const [agentName, setAgentName] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [costPerTicket, setCostPerTicket] = useState(0);
  const [sellPerTicket, setSellPerTicket] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    const pax = Number(passengers || 0);
    const cost = pax * Number(costPerTicket || 0);
    const sell = pax * Number(sellPerTicket || 0);

    const payload = {
      batch_id: batchId,
      agent_name: agentName || null,
      passengers: pax,
      cost_per_ticket: costPerTicket || null,
      sell_price_per_ticket: sellPerTicket || null,
      total_cost: cost,
      total_sell: sell,
    };

    const { error } = await supabase
      .from('group_ticket_bookings')
      .insert(payload);

    if (error) {
      console.error('Error inserting group ticket booking:', error);
      setErrorMsg('Insert error – console check karein.');
      setSubmitting(false);
    } else {
      router.push(`/group-ticketing/${batchId}`);
    }
  }

  return (
    <div className="p-6 max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Add booking to batch</h1>
        <p className="text-xs text-gray-500 mt-1">
          Batch ID: {batchId}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">
            Agent name
          </label>
          <input
            type="text"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            className="border rounded px-2 py-1"
            placeholder="e.g. ABC Travels"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              Passengers
            </label>
            <input
              type="number"
              min={1}
              value={passengers}
              onChange={(e) => setPassengers(Number(e.target.value) || 0)}
              className="border rounded px-2 py-1"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              Cost / ticket (SAR)
            </label>
            <input
              type="number"
              min={0}
              value={costPerTicket}
              onChange={(e) => setCostPerTicket(Number(e.target.value) || 0)}
              className="border rounded px-2 py-1"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              Sell / ticket (SAR)
            </label>
            <input
              type="number"
              min={0}
              value={sellPerTicket}
              onChange={(e) => setSellPerTicket(Number(e.target.value) || 0)}
              className="border rounded px-2 py-1"
            />
          </div>
        </div>

        <div className="border rounded-lg bg-gray-50 p-3 text-xs space-y-1">
          <div className="flex justify-between">
            <span>Total cost</span>
            <span>
              SAR {(passengers * costPerTicket || 0).toFixed(0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Total sell</span>
            <span>
              SAR {(passengers * sellPerTicket || 0).toFixed(0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Profit</span>
            <span>
              SAR{' '}
              {(
                passengers * (sellPerTicket - costPerTicket || 0)
              ).toFixed(0)}
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="text-xs text-red-600">{errorMsg}</div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded bg-black text-white text-xs disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save booking'}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/group-ticketing/${batchId}`)}
            className="text-xs underline text-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
