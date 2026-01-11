"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
export default function NewHotelPropertyPage() {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [name, setName] = useState("");
  const [chain, setChain] = useState("");
  const [stars, setStars] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!city.trim() || !name.trim()) return;

    setSaving(true);
    setError(null);

    const { error } = await supabase.from("hotel_properties").insert({
      city: city.trim().toLowerCase(),
      name: name.trim(),
      chain: chain.trim() || null,
      star_rating: stars ? Number(stars) : null,
      address: address.trim() || null,
      notes: notes.trim() || null,
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    router.push("/hotels/properties");
  };

  return (
    <div className="max-w-2xl space-y-4 p-6">
      <button
        type="button"
        onClick={() => router.push("/hotels/properties")}
        className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
      >
        ← Back to hotels
      </button>

      <h1 className="text-xl font-semibold">New Hotel</h1>

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
            City *
          </label>
          <input
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="makkah / madinah / jeddah"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600">
            Name *
          </label>
          <input
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Chain
            </label>
            <input
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={chain}
              onChange={(e) => setChain(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Star rating
            </label>
            <input
              type="number"
              min={1}
              max={5}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={stars}
              onChange={(e) => setStars(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600">
            Address
          </label>
          <textarea
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
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
            onClick={() => router.push("/hotels/properties")}
            className="rounded border px-3 py-1.5 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-black px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save hotel"}
          </button>
        </div>
      </form>
    </div>
  );
}
