"use client";

import { useState } from "react";

type QuoteResponse = {
  base_fare: number;
  agent_commission: number;
  total_price: number;
};

export default function NewTransportBookingPage() {
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleQuote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setQuoteLoading(true);
    setMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      vehicle_type: formData.get("vehicle_type"),
      distance_km: formData.get("distance_km"),
      base_fare_manual: formData.get("base_fare_manual"),
      agent_commission_percent: formData.get("agent_commission_percent"),
      profit_percent: formData.get("profit_percent"),
    };

    try {
      const res = await fetch("/api/rates/transport/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to get quote");
        setQuote(null);
        return;
      }

      setQuote(data);
      setMessage("Quote calculated successfully.");
    } catch (err: any) {
      console.error(err);
      setMessage("Error calculating quote.");
    } finally {
      setQuoteLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload: any = {
      customer_name: formData.get("customer_name"),
      customer_phone: formData.get("customer_phone"),
      agent_name: formData.get("agent_name"),
      agent_code: formData.get("agent_code"),
      pickup_city: formData.get("pickup_city"),
      pickup_location: formData.get("pickup_location"),
      dropoff_city: formData.get("dropoff_city"),
      dropoff_location: formData.get("dropoff_location"),
      pickup_time: formData.get("pickup_time"),
      passengers: Number(formData.get("passengers") || 1),
      vehicle_type: formData.get("vehicle_type"),
      notes: formData.get("notes"),
      distance_km: Number(formData.get("distance_km") || 0),
      base_fare: quote?.base_fare ?? Number(formData.get("base_fare_manual") || 0),
      agent_commission: quote?.agent_commission ?? 0,
      total_price: quote?.total_price ?? 0,
    };

    try {
      const res = await fetch("/api/transport/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Failed to create booking");
        return;
      }

      form.reset();
      setQuote(null);
      setMessage("Booking created successfully.");
    } catch (err: any) {
      console.error(err);
      setMessage("Error creating booking.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold mb-2">New Transport Booking</h1>

      {message && (
        <div className="border rounded-md px-4 py-2 text-sm">
          {message}
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit} onReset={() => setQuote(null)}>
        {/* Customer / Agent */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Customer Name</label>
            <input
              name="customer_name"
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Customer Phone</label>
            <input
              name="customer_phone"
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Agent Name</label>
            <input
              name="agent_name"
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Agent Code</label>
            <input
              name="agent_code"
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Route / Timing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Pickup City</label>
            <input
              name="pickup_city"
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="Jeddah"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pickup Location</label>
            <input
              name="pickup_location"
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="JED Airport"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Dropoff City</label>
            <input
              name="dropoff_city"
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="Makkah"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Dropoff Location</label>
            <input
              name="dropoff_location"
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="Hotel Name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pickup Time</label>
            <input
              name="pickup_time"
              type="datetime-local"
              className="w-full border rounded-md px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Passengers</label>
            <input
              name="passengers"
              type="number"
              min={1}
              className="w-full border rounded-md px-3 py-2 text-sm"
              defaultValue={1}
            />
          </div>
        </div>

        {/* Vehicle / pricing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Vehicle Type</label>
            <select
              name="vehicle_type"
              className="w-full border rounded-md px-3 py-2 text-sm"
              required
            >
              <option value="">Select vehicle</option>
              <option value="sedan">Sedan</option>
              <option value="hiace">Hiace</option>
              <option value="coaster">Coaster</option>
              <option value="gmc">GMC</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Distance (km)</label>
            <input
              name="distance_km"
              type="number"
              step="0.1"
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="80"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Base Fare (Manual override)
            </label>
            <input
              name="base_fare_manual"
              type="number"
              step="0.01"
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Agent Commission % (optional)
            </label>
            <input
              name="agent_commission_percent"
              type="number"
              step="0.1"
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Profit % (optional)
            </label>
            <input
              name="profit_percent"
              type="number"
              step="0.1"
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="15"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            name="notes"
            className="w-full border rounded-md px-3 py-2 text-sm min-h-[80px]"
          />
        </div>

        {/* Quote display */}
        {quote && (
          <div className="border rounded-md p-4 text-sm grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="font-medium text-xs uppercase">Base Fare</div>
              <div className="text-lg font-semibold">{quote.base_fare}</div>
            </div>
            <div>
              <div className="font-medium text-xs uppercase">Agent Commission</div>
              <div className="text-lg font-semibold">{quote.agent_commission}</div>
            </div>
            <div>
              <div className="font-medium text-xs uppercase">Total Price</div>
              <div className="text-lg font-semibold">{quote.total_price}</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={(e) => handleQuote(e as any)}
            disabled={quoteLoading}
            className="px-4 py-2 text-sm rounded-md border"
          >
            {quoteLoading ? "Calculating..." : "Get Quote"}
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm rounded-md border bg-black text-white"
          >
            {loading ? "Saving..." : "Save Booking"}
          </button>

          <button
            type="reset"
            className="px-4 py-2 text-sm rounded-md border"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
