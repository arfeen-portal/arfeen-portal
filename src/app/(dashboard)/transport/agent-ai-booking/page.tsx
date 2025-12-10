'use client';

import { useState } from 'react';
import AgentDynamicPricingBox from '@/components/pricing/AgentDynamicPricingBox';

export default function TransportAgentAiBookingPage() {
  const [agentId, setAgentId] = useState('');
  const [basePrice, setBasePrice] = useState<number | ''>('');
  const [finalPrice, setFinalPrice] = useState<number | ''>('');

  function handleSetBase() {
    if (!basePrice) return;
    setFinalPrice(basePrice);
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">
        Transport Booking – Agent Smart Pricing
      </h1>
      <p className="text-sm text-gray-500">
        Ye demo form hai jahan agent-wise rules se price suggest hota hai.
        Aap baad mein is logic ko apne main transport form ke andar reuse
        kar sakte hain.
      </p>

      <div className="bg-white rounded-lg p-4 shadow-sm space-y-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium">Agent ID</label>
          <input
            className="border rounded px-2 py-1 text-sm w-full"
            placeholder="Agent UUID (agents table se)"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
          />
          <p className="text-[11px] text-gray-500">
            Abhi simple text input hai – baad mein aap yahan dropdown ya
            auto-select agent list laga sakte hain.
          </p>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium">
            Base price (from rate engine)
          </label>
          <input
            type="number"
            className="border rounded px-2 py-1 text-sm w-full"
            value={basePrice}
            onChange={(e) =>
              setBasePrice(e.target.value ? Number(e.target.value) : '')
            }
          />
          <button
            type="button"
            onClick={handleSetBase}
            className="mt-2 px-3 py-1.5 text-xs rounded bg-blue-600 text-white"
          >
            Set Base
          </button>
        </div>

        <AgentDynamicPricingBox
          basePrice={Number(basePrice) || 0}
          agentId={agentId}
          onSelectPrice={(price) => setFinalPrice(price)}
        />

        <div className="space-y-1">
          <label className="block text-xs font-medium">
            Final price (will be saved in booking)
          </label>
          <input
            type="number"
            className="border rounded px-2 py-1 text-sm w-full"
            value={finalPrice}
            onChange={(e) =>
              setFinalPrice(e.target.value ? Number(e.target.value) : '')
            }
          />
        </div>

        <button
          type="button"
          className="mt-3 px-4 py-2 rounded bg-green-600 text-white text-sm"
        >
          Save Booking Draft (TODO)
        </button>
      </div>
    </div>
  );
}
