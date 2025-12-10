'use client';

import { useEffect, useState } from 'react';

type PricingTierKey = 'cheapest' | 'recommended' | 'vip';

type PricingSuggestion = {
  label: string;
  price: number;
  note: string;
};

type SuggestionsResponse = {
  cheapest: PricingSuggestion;
  recommended: PricingSuggestion;
  vip: PricingSuggestion;
};

type Props = {
  basePrice: number;
  occupancy?: 'low' | 'medium' | 'high';
  demandIndex?: number; // 1-10
  onSelectPrice?: (price: number, tier: PricingTierKey) => void;
};

export default function DynamicPricingBox({
  basePrice,
  occupancy = 'medium',
  demandIndex = 5,
  onSelectPrice
}: Props) {
  const [suggestions, setSuggestions] = useState<SuggestionsResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] =
    useState<PricingTierKey>('recommended');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!basePrice || basePrice <= 0) {
      setSuggestions(null);
      return;
    }
    loadSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePrice, occupancy, demandIndex]);

  async function loadSuggestions() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/pricing/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basePrice,
          occupancy,
          demandIndex
        })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed');
      }
      setSuggestions(data.suggestions);
      setSelectedTier('recommended');
      if (onSelectPrice) {
        onSelectPrice(data.suggestions.recommended.price, 'recommended');
      }
    } catch (e: any) {
      setError(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  function handleClickTier(tier: PricingTierKey) {
    if (!suggestions) return;
    setSelectedTier(tier);
    if (onSelectPrice) {
      const price = suggestions[tier].price;
      onSelectPrice(price, tier);
    }
  }

  if (!basePrice || basePrice <= 0) {
    return null;
  }

  return (
    <div className="mt-4 bg-white border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Dynamic Pricing Options</div>
          <div className="text-xs text-gray-500">
            Base price: {basePrice} SAR – system aap ke liye 3 options suggest
            karta hai.
          </div>
        </div>
        <button
          onClick={loadSuggestions}
          disabled={loading}
          className="px-2 py-1 text-xs rounded border bg-gray-50 disabled:opacity-60"
        >
          {loading ? 'Updating…' : 'Refresh'}
        </button>
      </div>

      {error && <div className="text-xs text-red-500">{error}</div>}

      {suggestions && (
        <div className="grid md:grid-cols-3 gap-2 text-sm">
          {(Object.keys(suggestions) as PricingTierKey[]).map((tier) => {
            const item = suggestions[tier];
            const isSelected = tier === selectedTier;

            return (
              <button
                key={tier}
                type="button"
                onClick={() => handleClickTier(tier)}
                className={`border rounded-lg p-2 text-left space-y-1 transition ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-xs uppercase">
                    {item.label}
                  </div>
                  {tier === 'recommended' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-600 text-white">
                      Best
                    </span>
                  )}
                  {tier === 'vip' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500 text-white">
                      VIP
                    </span>
                  )}
                </div>
                <div className="text-base font-bold">
                  {item.price.toLocaleString()} SAR
                </div>
                <div className="text-[11px] text-gray-500">{item.note}</div>
              </button>
            );
          })}
        </div>
      )}

      <div className="text-[11px] text-gray-400">
        Selected: <b>{selectedTier}</b> – yahi amount aapke booking total me
        apply ho ga.
      </div>
    </div>
  );
}
