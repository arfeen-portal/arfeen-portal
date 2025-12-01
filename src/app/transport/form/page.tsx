"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type FormState = {
  country: string;
  city: string;
  pickup_type: string;
  pickup_location: string;
  drop_type: string;
  drop_location: string;
  hotel_name: string;
  transfer_date: string; // datetime-local string
  pax_count: string;
  vehicle_class: string;
  currency: string;
  price: string;
  status: string;
};

const initialState: FormState = {
  country: "saudi arabia",
  city: "",
  pickup_type: "hotel",
  pickup_location: "",
  drop_type: "hotel", // ❗ constraint ke mutabiq `hotel` / `airport` jaisi value rakho
  drop_location: "",
  hotel_name: "",
  transfer_date: "",
  pax_count: "1",
  vehicle_class: "Hiace",
  currency: "SAR",
  price: "",
  status: "confirmed",
};

export default function TransportFormPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic required validation
    if (!form.city || !form.pickup_location || !form.drop_location || !form.transfer_date) {
      setError("City, pickup, drop location and transfer date are required.");
      setLoading(false);
      return;
    }

    const paxCountNumber = Number(form.pax_count || "1");
    const priceNumber = form.price ? Number(form.price) : null;

    const { error: insertError } = await supabase.from("transport_bookings").insert([
      {
        country: form.country || null,
        city: form.city || null,
        pickup_type: form.pickup_type || null,
        pickup_location: form.pickup_location || null,
        drop_type: form.drop_type || null,
        drop_location: form.drop_location || null,
        hotel_name: form.hotel_name || null,
        transfer_date: form.transfer_date || null, // Supabase timestamptz string accept kar lega
        pax_count: paxCountNumber || 1,
        vehicle_class: form.vehicle_class || null,
        currency: form.currency || null,
        price: priceNumber,
        status: form.status || null,
      },
    ]);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // success
    setLoading(false);
    setForm(initialState);
    router.push("/transport/book");
  };

  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold">New Transport Booking</h1>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-4 shadow-sm">
        {/* Row 1: Country & City */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600">Country</label>
            <input
              name="country"
              value={form.country}
              onChange={onChange}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600">City *</label>
            <input
              name="city"
              value={form.city}
              onChange={onChange}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              placeholder="Makkah, Madinah, Jeddah..."
              required
            />
          </div>
        </div>

        {/* Row 2: Pickup / Drop type + locations */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600">Pickup type</label>
            <select
              name="pickup_type"
              value={form.pickup_type}
              onChange={onChange}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
            >
              <option value="hotel">Hotel</option>
              <option value="airport">Airport</option>
            </select>
            <input
              name="pickup_location"
              value={form.pickup_location}
              onChange={onChange}
              className="mt-2 w-full rounded border px-2 py-1 text-sm"
              placeholder="Swissotel Makkah, JED Airport..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600">Drop type</label>
            <select
              name="drop_type"
              value={form.drop_type}
              onChange={onChange}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
            >
              <option value="hotel">Hotel</option>
              <option value="airport">Airport</option>
            </select>
            <input
              name="drop_location"
              value={form.drop_location}
              onChange={onChange}
              className="mt-2 w-full rounded border px-2 py-1 text-sm"
              placeholder="Madinah Hotel..."
              required
            />
          </div>
        </div>

        {/* Row 3: Transfer date + pax + vehicle */}
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600">Transfer date *</label>
            <input
              type="datetime-local"
              name="transfer_date"
              value={form.transfer_date}
              onChange={onChange}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600">Pax count *</label>
            <input
              type="number"
              min={1}
              name="pax_count"
              value={form.pax_count}
              onChange={onChange}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600">Vehicle class</label>
            <input
              name="vehicle_class"
              value={form.vehicle_class}
              onChange={onChange}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              placeholder="Hiace, GMC, Coaster..."
            />
          </div>
        </div>

        {/* Row 4: Hotel name optional */}
        <div>
          <label className="block text-xs font-semibold text-gray-600">Hotel name (optional)</label>
          <textarea
            name="hotel_name"
            value={form.hotel_name}
            onChange={onChange}
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
            rows={2}
          />
        </div>

        {/* Row 5: Price & status */}
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600">Currency</label>
            <input
              name="currency"
              value={form.currency}
              onChange={onChange}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600">Price</label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={onChange}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              placeholder="450"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={onChange}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
            >
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => router.push("/transport/book")}
            className="rounded border px-3 py-1.5 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-black px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save booking"}
          </button>
        </div>
      </form>
    </div>
  );
}
