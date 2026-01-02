"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
export const dynamic = "force-dynamic";
export default function NewRoutePage() {
  const router = useRouter();
  const [routeName, setRouteName] = useState("");
  const [originCity, setOriginCity] = useState("");
  const [originType, setOriginType] = useState("airport");
  const [originLocation, setOriginLocation] = useState("");
  const [destCity, setDestCity] = useState("");
  const [destType, setDestType] = useState("hotel");
  const [destLocation, setDestLocation] = useState("");
  const [currency, setCurrency] = useState("SAR");
  const [basePrice, setBasePrice] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!routeName.trim()) return;

    setSaving(true);
    setError(null);

    const { error } = await supabase.from("transport_routes").insert({
      route_name: routeName.trim(),
      origin_city: originCity.trim().toLowerCase(),
      origin_type: originType,
      origin_location: originLocation.trim() || null,
      destination_city: destCity.trim().toLowerCase(),
      destination_type: destType,
      destination_location: destLocation.trim() || null,
      currency: currency.trim() || "SAR",
      base_price: basePrice ? Number(basePrice) : null,
      is_active: isActive,
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    router.push("/transport/routes");
  };

  return (
    <div className="max-w-3xl space-y-4 p-6">
      <button
        type="button"
        onClick={() => router.push("/transport/routes")}
        className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
      >
        ← Back to routes
      </button>

      <h1 className="text-xl font-semibold">New Transport Route</h1>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border bg-white p-4 shadow-sm"
      >
        <div>
          <label className="block text-xs font-semibold text-gray-600">
            Route name *
          </label>
          <input
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Origin city *
            </label>
            <input
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={originCity}
              onChange={(e) => setOriginCity(e.target.value)}
              required
            />
            <label className="mt-2 block text-xs font-semibold text-gray-600">
              Origin type
            </label>
            <select
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={originType}
              onChange={(e) => setOriginType(e.target.value)}
            >
              <option value="airport">Airport</option>
              <option value="hotel">Hotel</option>
              <option value="city">City</option>
            </select>
            <input
              className="mt-2 w-full rounded border px-2 py-1 text-sm"
              placeholder="Origin location (optional)"
              value={originLocation}
              onChange={(e) => setOriginLocation(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Destination city *
            </label>
            <input
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={destCity}
              onChange={(e) => setDestCity(e.target.value)}
              required
            />
            <label className="mt-2 block text-xs font-semibold text-gray-600">
              Destination type
            </label>
            <select
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={destType}
              onChange={(e) => setDestType(e.target.value)}
            >
              <option value="hotel">Hotel</option>
              <option value="airport">Airport</option>
              <option value="city">City</option>
            </select>
            <input
              className="mt-2 w-full rounded border px-2 py-1 text-sm"
              placeholder="Destination location (optional)"
              value={destLocation}
              onChange={(e) => setDestLocation(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
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
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Base price
            </label>
            <input
              type="number"
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <input
              id="routeActive"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <label
              htmlFor="routeActive"
              className="text-xs font-semibold text-gray-600"
            >
              Active
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => router.push("/transport/routes")}
            className="rounded border px-3 py-1.5 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-black px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save route"}
          </button>
        </div>
      </form>
    </div>
  );
}
