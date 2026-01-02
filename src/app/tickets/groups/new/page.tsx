"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
export const dynamic = "force-dynamic";
export default function NewGroupTicketPage() {
  const router = useRouter();

  const [groupCode, setGroupCode] = useState("");
  const [airline, setAirline] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [depDate, setDepDate] = useState("");
  const [retDate, setRetDate] = useState("");
  const [seats, setSeats] = useState("");
  const [currency, setCurrency] = useState("PKR");
  const [seatPrice, setSeatPrice] = useState("");
  const [status, setStatus] = useState("open");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!groupCode.trim()) return;

    setSaving(true);
    setError(null);

    const { error } = await supabase.from("group_tickets").insert({
      group_code: groupCode.trim(),
      airline: airline.trim() || null,
      origin: origin.trim().toUpperCase(),
      destination: destination.trim().toUpperCase(),
      departure_date: depDate || null,
      return_date: retDate || null,
      total_seats: seats ? Number(seats) : null,
      currency: currency.trim() || "PKR",
      seat_price: seatPrice ? Number(seatPrice) : null,
      status,
      notes: notes.trim() || null,
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    router.push("/tickets/groups");
  };

  return (
    <div className="max-w-3xl space-y-4 p-6">
      <button
        type="button"
        onClick={() => router.push("/tickets/groups")}
        className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
      >
        ← Back to groups
      </button>

      <h1 className="text-xl font-semibold">New Group Ticket</h1>

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
              Group code *
            </label>
            <input
              className="mt-1 w-full rounded border px-2 py-1 text-sm font-mono"
              value={groupCode}
              onChange={(e) => setGroupCode(e.target.value)}
              placeholder="GT-2025-UMR-001"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Airline
            </label>
            <input
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={airline}
              onChange={(e) => setAirline(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Origin (IATA)
            </label>
            <input
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="KHI"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Destination (IATA)
            </label>
            <input
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="JED"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Total seats
            </label>
            <input
              type="number"
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Departure date
            </label>
            <input
              type="date"
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={depDate}
              onChange={(e) => setDepDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Return date
            </label>
            <input
              type="date"
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={retDate}
              onChange={(e) => setRetDate(e.target.value)}
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

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Seat price
            </label>
            <input
              type="number"
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={seatPrice}
              onChange={(e) => setSeatPrice(e.target.value)}
            />
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
              <option value="open">open</option>
              <option value="held">held</option>
              <option value="soldout">soldout</option>
              <option value="closed">closed</option>
            </select>
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
            onClick={() => router.push("/tickets/groups")}
            className="rounded border px-3 py-1.5 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-black px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save group"}
          </button>
        </div>
      </form>
    </div>
  );
}
