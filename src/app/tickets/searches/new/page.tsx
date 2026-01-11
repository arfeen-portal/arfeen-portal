"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
export default function NewFlightSearchPage() {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [depart, setDepart] = useState("");
  const [ret, setRet] = useState("");
  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");
  const [infants, setInfants] = useState("0");
  const [cabin, setCabin] = useState("ECONOMY");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim() || !depart) return;

    setSaving(true);
    setError(null);

    const { error } = await supabase.from("flight_search_sessions").insert({
      origin: origin.trim().toUpperCase(),
      destination: destination.trim().toUpperCase(),
      depart_date: depart,
      return_date: ret || null,
      adults: Number(adults || "1"),
      children: Number(children || "0"),
      infants: Number(infants || "0"),
      cabin_class: cabin,
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    router.push("/tickets/searches");
  };

  return (
    <div className="max-w-2xl space-y-4 p-6">
      <button
        type="button"
        onClick={() => router.push("/tickets/searches")}
        className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
      >
        ← Back to searches
      </button>

      <h1 className="text-xl font-semibold">New Flight Search</h1>

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
              Origin (IATA)
            </label>
            <input
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="KHI"
              required
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
              required
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Departure date
            </label>
            <input
              type="date"
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={depart}
              onChange={(e) => setDepart(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Return date (optional)
            </label>
            <input
              type="date"
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={ret}
              onChange={(e) => setRet(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Adults
            </label>
            <input
              type="number"
              min={1}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={adults}
              onChange={(e) => setAdults(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Children
            </label>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={children}
              onChange={(e) => setChildren(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Infants
            </label>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={infants}
              onChange={(e) => setInfants(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600">
            Cabin
          </label>
          <select
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
            value={cabin}
            onChange={(e) => setCabin(e.target.value)}
          >
            <option value="ECONOMY">ECONOMY</option>
            <option value="PREMIUM_ECONOMY">PREMIUM ECONOMY</option>
            <option value="BUSINESS">BUSINESS</option>
            <option value="FIRST">FIRST</option>
          </select>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-black px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save search"}
          </button>
        </div>
      </form>
    </div>
  );
}
