"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
export const dynamic = "force-dynamic";
export default function NewCalculatorPresetPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("PKR");
  const [ticket, setTicket] = useState("");
  const [visa, setVisa] = useState("");
  const [serviceFee, setServiceFee] = useState("");
  const [hotel, setHotel] = useState("");
  const [transport, setTransport] = useState("");
  const [profit, setProfit] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError(null);

    const { error } = await supabase.from("umrah_calculator_presets").insert({
      name: name.trim(),
      base_currency: currency.trim() || "PKR",
      ticket_price: ticket ? Number(ticket) : null,
      visa_price: visa ? Number(visa) : null,
      service_fee: serviceFee ? Number(serviceFee) : null,
      hotel_budget: hotel ? Number(hotel) : null,
      transport_budget: transport ? Number(transport) : null,
      profit_margin: profit ? Number(profit) : null,
      notes: notes.trim() || null,
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    router.push("/umrah/calculator/presets");
  };

  return (
    <div className="max-w-3xl space-y-4 p-6">
      <button
        type="button"
        onClick={() => router.push("/umrah/calculator/presets")}
        className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
      >
        ← Back to presets
      </button>

      <h1 className="text-xl font-semibold">New Umrah Calculator Preset</h1>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded border bg-white p-4 shadow-sm"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Name *
            </label>
            <input
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="15 days econ JED route (PKR)"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Currency
            </label>
            <input
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Ticket price
            </label>
            <input
              type="number"
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={ticket}
              onChange={(e) => setTicket(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Visa price
            </label>
            <input
              type="number"
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={visa}
              onChange={(e) => setVisa(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Service fee
            </label>
            <input
              type="number"
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={serviceFee}
              onChange={(e) => setServiceFee(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Hotel budget
            </label>
            <input
              type="number"
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={hotel}
              onChange={(e) => setHotel(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Transport budget
            </label>
            <input
              type="number"
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={transport}
              onChange={(e) => setTransport(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Profit margin
            </label>
            <input
              type="number"
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={profit}
              onChange={(e) => setProfit(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600">
            Notes
          </label>
          <textarea
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => router.push("/umrah/calculator/presets")}
            className="rounded border px-3 py-1.5 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-black px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save preset"}
          </button>
        </div>
      </form>
    </div>
  );
}
