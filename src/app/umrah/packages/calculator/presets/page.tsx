"use client";

import { useEffect, useState, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
export const dynamic = "force-dynamic";
type Preset = {
  id: string;
  name: string;
  base_currency: string;
  ticket_price: number | null;
  visa_price: number | null;
  service_fee: number | null;
  hotel_budget: number | null;
  transport_budget: number | null;
  profit_margin: number | null;
};

export default function UmrahCalculatorPage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(true);
  const [selectedPresetId, setSelectedPresetId] = useState<string | "">("");
  const [pax, setPax] = useState("1");
  const [result, setResult] = useState<{
    currency: string;
    costPerPerson: number;
    pricePerPerson: number;
    totalCost: number;
    totalPrice: number;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("umrah_calculator_presets")
        .select("*")
        .order("created_at", { ascending: false });
      setPresets((data as Preset[]) || []);
      setLoadingPresets(false);
    };
    load();
  }, []);

  const handleCalculate = async (e: FormEvent) => {
    e.preventDefault();
    const preset = presets.find((p) => p.id === selectedPresetId);
    if (!preset) return;

    const nPax = Number(pax || "1");
    const t =
      (preset.ticket_price ?? 0) +
      (preset.visa_price ?? 0) +
      (preset.service_fee ?? 0) +
      (preset.hotel_budget ?? 0) +
      (preset.transport_budget ?? 0);

    const profit = preset.profit_margin ?? 0;

    const costPerPerson = t;
    const pricePerPerson = t + profit;
    const totalCost = costPerPerson * nPax;
    const totalPrice = pricePerPerson * nPax;

    setResult({
      currency: preset.base_currency,
      costPerPerson,
      pricePerPerson,
      totalCost,
      totalPrice,
    });

    setSaving(true);
    setError(null);

    const { error } = await supabase.from("umrah_calculator_logs").insert({
      preset_id: preset.id,
      pax_count: nPax,
      total_cost: totalCost,
      total_price: totalPrice,
      currency: preset.base_currency,
      inputs_json: {
        preset,
        pax: nPax,
        breakdown: {
          ticket: preset.ticket_price,
          visa: preset.visa_price,
          service_fee: preset.service_fee,
          hotel: preset.hotel_budget,
          transport: preset.transport_budget,
          profit_margin: preset.profit_margin,
        },
      },
    });

    if (error) {
      setError(error.message);
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">Umrah Calculator</h1>

      {loadingPresets ? (
        <div className="text-sm text-gray-500">Loading presets...</div>
      ) : presets.length === 0 ? (
        <div className="text-sm text-gray-500">
          No presets. Pehle{" "}
          <a
            href="/umrah/calculator/presets/new"
            className="text-blue-600 underline"
          >
            preset create
          </a>{" "}
          karein.
        </div>
      ) : null}

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {presets.length > 0 && (
        <form
          onSubmit={handleCalculate}
          className="space-y-4 rounded border bg-white p-4 shadow-sm"
        >
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Preset
            </label>
            <select
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={selectedPresetId}
              onChange={(e) => setSelectedPresetId(e.target.value)}
              required
            >
              <option value="">Select preset…</option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.base_currency})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Pax
            </label>
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={pax}
              onChange={(e) => setPax(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-black px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {saving ? "Calculating..." : "Calculate & save"}
            </button>
          </div>
        </form>
      )}

      {result && (
        <div className="space-y-2 rounded border bg-white p-4 text-sm shadow-sm">
          <h2 className="text-sm font-semibold">Result</h2>
          <p>
            Cost per person:{" "}
            <strong>
              {result.currency} {result.costPerPerson.toFixed(0)}
            </strong>
          </p>
          <p>
            Price per person:{" "}
            <strong>
              {result.currency} {result.pricePerPerson.toFixed(0)}
            </strong>
          </p>
          <p>
            Total cost:{" "}
            <strong>
              {result.currency} {result.totalCost.toFixed(0)}
            </strong>
          </p>
          <p>
            Total price:{" "}
            <strong>
              {result.currency} {result.totalPrice.toFixed(0)}
            </strong>
          </p>
        </div>
      )}
    </div>
  );
}
