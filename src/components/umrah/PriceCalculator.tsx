'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
type UmrahPackageLite = {
  id: string;
  name: string;
  code?: string | null;
  base_price: number;
  default_nights?: number | null;
  default_pax?: number | null;
};

type PriceCalculatorProps = {
  pkg: UmrahPackageLite;
  // Agar aap external button se "Save" handle karna chahen to isko false kar sakte ho
  allowSaveToDb?: boolean;
};

type CalculatorRule = {
  id: string;
  package_id?: string | null;
  scope?: string | null; // 'global' | 'package'
  rule_type?: string | null; // 'per_night' | 'per_pax' | 'transport' | ...
  value?: number | null; // numeric amount
  is_percentage?: boolean | null;
};

export function PriceCalculator({ pkg, allowSaveToDb = true }: PriceCalculatorProps) {
  const [adults, setAdults] = useState(pkg.default_pax ?? 2);
  const [children, setChildren] = useState(0);
  const [nights, setNights] = useState(pkg.default_nights ?? 10);
  const [transportAddon, setTransportAddon] = useState(0);
  const [rules, setRules] = useState<CalculatorRule[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // RULES LOAD
  useEffect(() => {
    let isMounted = true;

    async function loadRules() {
      const { data, error } = await supabase
        .from('umrah_calculator_rules')
        .select('*')
        .or('scope.eq.global,package_id.eq.' + pkg.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error loading calculator rules:', error);
        return;
      }
      if (isMounted) {
        setRules((data as CalculatorRule[]) ?? []);
      }
    }

    loadRules();
    return () => {
      isMounted = false;
    };
  }, [pkg.id]);

  const totalPax = adults + children;

  const pricing = useMemo(() => {
    const base = Number(pkg.base_price) || 0;

    const perNightRule =
      rules.find(
        (r) =>
          (r.rule_type === 'per_night' || r.rule_type === 'night') &&
          (r.package_id === pkg.id || r.scope === 'global'),
      ) || null;

    const perPaxRule =
      rules.find(
        (r) =>
          (r.rule_type === 'per_pax' || r.rule_type === 'pax') &&
          (r.package_id === pkg.id || r.scope === 'global'),
      ) || null;

    const defaultNights = Number(pkg.default_nights ?? 0);
    const defaultPax = Number(pkg.default_pax ?? 2);

    const nightsDiff = Math.max(0, nights - defaultNights);
    const paxDiff = Math.max(0, totalPax - defaultPax);

    const perNightAmount = perNightRule?.value ?? 0;
    const perPaxAmount = perPaxRule?.value ?? 0;

    const extraNightCost = nightsDiff * perNightAmount;
    const extraPaxCost = paxDiff * perPaxAmount;

    const subtotal = base + extraNightCost + extraPaxCost + transportAddon;

    return {
      base,
      extraNightCost,
      extraPaxCost,
      transportAddon,
      total: subtotal,
      nightsDiff,
      paxDiff,
      perNightAmount,
      perPaxAmount,
    };
  }, [pkg, rules, nights, totalPax, transportAddon]);

  async function handleSave() {
    try {
      setSaving(true);
      setSaveMessage(null);

      const payload = {
        package_id: pkg.id,
        total_price: pricing.total,
        params: {
          adults,
          children,
          nights,
          transportAddon,
          rulesUsed: rules.map((r) => ({
            id: r.id,
            rule_type: r.rule_type,
            value: r.value,
          })),
        },
      };

      const { error } = await supabase.from('umrah_package_pricing').insert(payload);

      if (error) {
        console.error('Error saving package pricing:', error);
        setSaveMessage('Error while saving price. Console check karo.');
      } else {
        setSaveMessage('Price saved in umrah_package_pricing 👍');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-500 mb-1">
            Adults
          </label>
          <input
            type="number"
            min={1}
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value) || 0)}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-500 mb-1">
            Children
          </label>
          <input
            type="number"
            min={0}
            value={children}
            onChange={(e) => setChildren(Number(e.target.value) || 0)}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-500 mb-1">
            Nights
          </label>
          <input
            type="number"
            min={1}
            value={nights}
            onChange={(e) => setNights(Number(e.target.value) || 0)}
            className="border rounded px-2 py-1 text-sm"
          />
          <span className="mt-1 text-[11px] text-gray-400">
            Default: {pkg.default_nights ?? '--'}
          </span>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-500 mb-1">
            Transport addon (SAR)
          </label>
          <input
            type="number"
            min={0}
            value={transportAddon}
            onChange={(e) => setTransportAddon(Number(e.target.value) || 0)}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-gray-50 space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Base package price</span>
          <span className="font-semibold">SAR {pricing.base.toFixed(0)}</span>
        </div>

        <div className="flex justify-between text-xs text-gray-600">
          <span>
            Extra nights ({pricing.nightsDiff} × {pricing.perNightAmount})
          </span>
          <span>SAR {pricing.extraNightCost.toFixed(0)}</span>
        </div>

        <div className="flex justify-between text-xs text-gray-600">
          <span>
            Extra pax ({pricing.paxDiff} × {pricing.perPaxAmount})
          </span>
          <span>SAR {pricing.extraPaxCost.toFixed(0)}</span>
        </div>

        <div className="flex justify-between text-xs text-gray-600">
          <span>Transport add-on</span>
          <span>SAR {pricing.transportAddon.toFixed(0)}</span>
        </div>

        <hr className="my-2" />

        <div className="flex justify-between text-base font-semibold">
          <span>Total package price</span>
          <span>SAR {pricing.total.toFixed(0)}</span>
        </div>

        <p className="mt-2 text-[11px] text-gray-400">
          Yeh calculation front-end rules + DB rules dono ka mix hai. Kabhi
          bhi SQL me rule structure change karein to sirf rule values adjust
          karni hongi, logic same rahega.
        </p>
      </div>

      {allowSaveToDb && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded bg-black text-white text-sm disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save price to DB'}
          </button>
          {saveMessage && (
            <span className="text-xs text-gray-600">{saveMessage}</span>
          )}
        </div>
      )}
    </div>
  );
}
