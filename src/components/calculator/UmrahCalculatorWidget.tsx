"use client";

import { useMemo, useState } from "react";

type UmrahPackage = {
  id: string;
  name: string;
  base_price: number | null;
  currency: string | null;
};

type CalculatorRule = {
  id: string;
  name: string;
  per_person_markup: number | null;
  fixed_markup: number | null;
};

export default function UmrahCalculatorWidget({
  packages,
  rules,
  defaultPackageId,
}: {
  packages: UmrahPackage[];
  rules: CalculatorRule[];
  defaultPackageId?: string;
}) {
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    defaultPackageId || packages[0]?.id || ""
  );

  const [pax, setPax] = useState<number>(2);
  const [nights, setNights] = useState<number>(14);

  const selectedPackage = useMemo(
    () => packages.find((p) => p.id === selectedPackageId),
    [packages, selectedPackageId]
  );

  const baseCurrency = selectedPackage?.currency || "SAR";
  const basePrice = selectedPackage?.base_price || 0;

  const perPersonAddition = rules.reduce(
    (sum, r) => sum + (r.per_person_markup ?? 0),
    0
  );

  const fixedAddition = rules.reduce(
    (sum, r) => sum + (r.fixed_markup ?? 0),
    0
  );

  const perPersonTotal = basePrice + perPersonAddition;
  const total = pax * perPersonTotal + fixedAddition;

  return (
    <div className="space-y-5 text-sm">
      {/* Inputs */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="block mb-1 font-medium">Package</label>
          <select
            value={selectedPackageId}
            onChange={(e) => setSelectedPackageId(e.target.value)}
            className="border rounded px-2 py-1 w-full"
          >
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 font-medium">Passengers (pax)</label>
            <input
              type="number"
              min={1}
              value={pax}
              onChange={(e) => setPax(Number(e.target.value))}
              className="border rounded px-2 py-1 w-full"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Total nights</label>
            <input
              type="number"
              min={1}
              value={nights}
              onChange={(e) => setNights(Number(e.target.value))}
              className="border rounded px-2 py-1 w-full"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Nights info ke liye hai, future me rules me include ho sakta hai
            </p>
          </div>
        </div>
      </div>

      {/* Rules summary */}
      <div className="border rounded p-3 bg-white">
        <div className="font-semibold mb-2">
          Calculator rules (DB se)
        </div>

        {rules.length === 0 && (
          <p className="text-xs text-gray-500">
            Abhi koi active rule nahi – sirf base price use ho raha hai.
          </p>
        )}

        {rules.map((r) => (
          <div key={r.id} className="flex justify-between text-xs py-1">
            <span>{r.name}</span>
            <span className="text-gray-600">
              {r.per_person_markup && (
                <>
                  +{baseCurrency} {r.per_person_markup}/person{" "}
                </>
              )}
              {r.fixed_markup && (
                <>
                  +{baseCurrency} {r.fixed_markup} fixed
                </>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Result */}
      <div className="border rounded p-3 bg-green-50">
        <div className="text-xs text-gray-500 uppercase mb-1">
          Estimated total
        </div>

        <div className="text-2xl font-semibold">
          {baseCurrency} {total.toLocaleString()}
        </div>

        <div className="text-[11px] text-gray-600 mt-1">
          Base: {baseCurrency} {basePrice.toLocaleString()} / person <br />
          Per-person markup: {baseCurrency}{" "}
          {perPersonAddition.toLocaleString()} <br />
          Fixed: {baseCurrency} {fixedAddition.toLocaleString()}
        </div>

        <div className="text-[11px] text-gray-500 mt-1">
          Formula: pax × (base + per-person markups) + fixed markups
        </div>
      </div>
    </div>
  );
}
