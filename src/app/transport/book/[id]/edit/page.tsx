"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
type FormState = {
  country: string;
  city: string;
  pickup_type: string;
  pickup_location: string;
  drop_type: string;
  drop_location: string;
  hotel_name: string;
  transfer_date: string;
  pax_count: string;
  vehicle_class: string;
  currency: string;
  price: string;
  status: string;
};

export default function EditBookingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Booking load karo
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("transport_bookings")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setForm({
        country: data.country || "",
        city: data.city || "",
        pickup_type: data.pickup_type || "hotel",
        pickup_location: data.pickup_location || "",
        drop_type: data.drop_type || "hotel",
        drop_location: data.drop_location || "",
        hotel_name: data.hotel_name || "",
        transfer_date: data.transfer_date || "",
        pax_count: String(data.pax_count ?? "1"),
        vehicle_class: data.vehicle_class || "",
        currency: data.currency || "SAR",
        price: data.price != null ? String(data.price) : "",
        status: data.status || "confirmed",
      });
      setLoading(false);
    };

    load();
  }, [id]);

  const onChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form || !id) return;

    setSaving(true);
    setError(null);

    const { error } = await supabase
      .from("transport_bookings")
      .update({
        country: form.country || null,
        city: form.city || null,
        pickup_type: form.pickup_type || null,
        pickup_location: form.pickup_location || null,
        drop_type: form.drop_type || null,
        drop_location: form.drop_location || null,
        hotel_name: form.hotel_name || null,
        transfer_date: form.transfer_date || null,
        pax_count: Number(form.pax_count || "1"),
        vehicle_class: form.vehicle_class || null,
        currency: form.currency || null,
        price: form.price ? Number(form.price) : null,
        status: form.status || null,
      })
      .eq("id", id);

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    router.push(`/transport/book/${id}`);
  };

  if (loading || !form) {
    return <div className="p-4 text-sm">Loading booking...</div>;
  }

  return (
    <div className="max-w-3xl space-y-4 p-6">
      <button
        onClick={() => router.push(`/transport/book/${id}`)}
        className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
      >
        ← Back to details
      </button>

      <h1 className="text-xl font-semibold">Edit Transport Booking</h1>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border bg-white p-4 shadow-sm"
      >
        {/* same fields as create form, bas value form se aa rahi hai */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Country
            </label>
            <input
              name="country"
              value={form.country}
              onChange={onChange}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              City *
            </label>
            <input
              name="city"
              value={form.city}
              onChange={onChange}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Pickup type
            </label>
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
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Drop type
            </label>
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
              required
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Transfer date
            </label>
            <input
              type="datetime-local"
              name="transfer_date"
              value={form.transfer_date}
              onChange={onChange}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Pax count
            </label>
            <input
              type="number"
              min={1}
              name="pax_count"
              value={form.pax_count}
              onChange={onChange}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Vehicle class
            </label>
            <input
              name="vehicle_class"
              value={form.vehicle_class}
              onChange={onChange}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600">
            Hotel name (optional)
          </label>
          <textarea
            name="hotel_name"
            value={form.hotel_name}
            onChange={onChange}
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
            rows={2}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Currency
            </label>
            <input
              name="currency"
              value={form.currency}
              onChange={onChange}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Price
            </label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={onChange}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Status
            </label>
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

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => router.push(`/transport/book/${id}`)}
            className="rounded border px-3 py-1.5 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-black px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
