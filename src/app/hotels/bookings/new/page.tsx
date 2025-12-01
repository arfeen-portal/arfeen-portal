"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Hotel = { id: string; name: string; city: string };

export default function NewHotelBookingPage() {
  const router = useRouter();

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelId, setHotelId] = useState("");
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [nights, setNights] = useState("");
  const [pax, setPax] = useState("1");
  const [currency, setCurrency] = useState("SAR");
  const [totalPrice, setTotalPrice] = useState("");
  const [guestName, setGuestName] = useState("");
  const [agentName, setAgentName] = useState("");
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHotels = async () => {
      const { data } = await supabase
        .from("hotel_properties")
        .select("id,name,city")
        .order("city")
        .order("name");
      setHotels((data as Hotel[]) || []);
    };
    loadHotels();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!hotelId || !checkin || !checkout) return;

    setSaving(true);
    setError(null);

    const { error } = await supabase.from("hotel_bookings").insert({
      hotel_id: hotelId,
      checkin_date: checkin,
      checkout_date: checkout,
      nights: nights ? Number(nights) : null,
      pax_count: pax ? Number(pax) : null,
      currency: currency.trim() || "SAR",
      total_price: totalPrice ? Number(totalPrice) : null,
      guest_name: guestName.trim() || null,
      agent_name: agentName.trim() || null,
      booking_status: status,
      notes: notes.trim() || null,
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    router.push("/hotels/bookings");
  };

  return (
    <div className="max-w-3xl space-y-4 p-6">
      <button
        type="button"
        onClick={() => router.push("/hotels/bookings")}
        className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
      >
        ← Back to bookings
      </button>

      <h1 className="text-xl font-semibold">New Hotel Booking</h1>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded border bg-white p-4 shadow-sm"
      >
        <div>
          <label className="block text-xs font-semibold text-gray-600">
            Hotel *
          </label>
          <select
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
            value={hotelId}
            onChange={(e) => setHotelId(e.target.value)}
            required
          >
            <option value="">Select hotel…</option>
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.city} – {h.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Check-in
            </label>
            <input
              type="date"
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={checkin}
              onChange={(e) => setCheckin(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Check-out
            </label>
            <input
              type="date"
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={checkout}
              onChange={(e) => setCheckout(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Nights
            </label>
            <input
              type="number"
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={nights}
              onChange={(e) => setNights(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
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
              Total price
            </label>
            <input
              type="number"
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Guest name
            </label>
            <input
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Agent name
            </label>
            <input
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600">
            Status
          </label>
          <select
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="pending">pending</option>
            <option value="confirmed">confirmed</option>
            <option value="cancelled">cancelled</option>
          </select>
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
            onClick={() => router.push("/hotels/bookings")}
            className="rounded border px-3 py-1.5 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-black px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save booking"}
          </button>
        </div>
      </form>
    </div>
  );
}
