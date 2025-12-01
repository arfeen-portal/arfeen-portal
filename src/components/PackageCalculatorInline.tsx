'use client';

import { useState } from 'react';

type PackageSummary = {
  id: string;
  name: string;
  code: string | null;
};

type Props = {
  pkg: PackageSummary;
};

export default function PackageCalculatorInline({ pkg }: Props) {
  const [basePrice, setBasePrice] = useState<number>(0);
  const [pax, setPax] = useState<number>(2);
  const [nights, setNights] = useState<number>(10);
  const [agentMargin, setAgentMargin] = useState<number>(300);
  const [notes, setNotes] = useState<string>('');

  const baseTotal = basePrice * pax;
  const extraNightsCost = basePrice * 0.5 * Math.max(0, nights - 10); // simple rule example
  const grossTotal = baseTotal + extraNightsCost + agentMargin;
  const perPerson = pax > 0 ? Math.round(grossTotal / pax) : 0;

  return (
    <div className="space-y-6">
      {/* Header / summary */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{pkg.name}</h2>
            <p className="text-xs text-gray-500">
              Code: {pkg.code || '—'}
            </p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <div>Dynamic Umrah Calculator</div>
            <div className="font-medium text-gray-800">
              {perPerson > 0 ? `~ SAR ${perPerson.toLocaleString()} / pax` : 'Enter values to calculate'}
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Base price per pax (SAR)
            </label>
            <input
              type="number"
              className="w-full border rounded px-2 py-1 text-sm"
              value={basePrice}
              onChange={(e) => setBasePrice(Number(e.target.value) || 0)}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Total land + services per passenger (no agent margin).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Pax
              </label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1 text-sm"
                value={pax}
                onChange={(e) => setPax(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Nights
              </label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1 text-sm"
                value={nights}
                onChange={(e) => setNights(Number(e.target.value) || 0)}
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Simple rule: 10 nights included, extra nights = 50% of base / pax.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Agent margin (total SAR)
            </label>
            <input
              type="number"
              className="w-full border rounded px-2 py-1 text-sm"
              value={agentMargin}
              onChange={(e) => setAgentMargin(Number(e.target.value) || 0)}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Your total profit on the package (not per pax).
            </p>
          </div>
        </div>

        {/* Result card */}
        <div className="border rounded-lg p-4 bg-white space-y-3 shadow-sm">
          <h3 className="text-sm font-semibold">Pricing summary</h3>

          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Base ({pax} pax)</span>
              <span className="font-medium">SAR {baseTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">
                Extra nights ({Math.max(0, nights - 10)} x 50% of base)
              </span>
              <span className="font-medium">SAR {extraNightsCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Agent margin</span>
              <span className="font-medium">SAR {agentMargin.toLocaleString()}</span>
            </div>
            <hr />
            <div className="flex justify-between text-base font-semibold">
              <span>Total package</span>
              <span>SAR {grossTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Per pax</span>
              <span>
                {perPerson > 0 ? `SAR ${perPerson.toLocaleString()}` : '—'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Notes (optional)
            </label>
            <textarea
              className="w-full border rounded px-2 py-1 text-xs min-h-[60px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Hotel pair, season, extra comments for this quote..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
