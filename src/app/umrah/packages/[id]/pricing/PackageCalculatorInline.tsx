'use client';

import { FormEvent, useState } from 'react';

interface Props {
  packageId: string;
}

type QuoteResp = {
  total_price: number;
  base_price: number;
  notes?: string;
};

export default function PackageCalculatorInline({ packageId }: Props) {
  const [pax, setPax] = useState(2);
  const [nights, setNights] = useState(14);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuoteResp | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/calculator/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, pax, nights }),
      });

      if (!res.ok) throw new Error('API error');
      const data: QuoteResp = await res.json();
      setResult(data);
    } catch (err) {
      console.error('inline calc error', err);
      setError('Quote calculate nahi ho saka.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 border rounded-xl p-5 bg-white space-y-4">
      <h2 className="text-lg font-semibold">Test price for this package</h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium mb-1">Passengers</label>
          <input
            type="number"
            min={1}
            value={pax}
            onChange={(e) => setPax(Number(e.target.value))}
            className="border rounded px-3 py-2 w-full text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Nights</label>
          <input
            type="number"
            min={1}
            value={nights}
            onChange={(e) => setNights(Number(e.target.value))}
            className="border rounded px-3 py-2 w-full text-sm"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded bg-black text-white text-sm font-medium w-full disabled:opacity-60"
          >
            {loading ? 'Calculating…' : 'Get quote'}
          </button>
        </div>
      </form>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {result && (
        <div className="text-sm space-y-1">
          <p>
            Base price: <strong>SAR {result.base_price.toFixed(0)}</strong>
          </p>
          <p>
            Total: <strong>SAR {result.total_price.toFixed(0)}</strong>
          </p>
          {result.notes && (
            <p className="text-xs text-slate-500 mt-1">{result.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}
