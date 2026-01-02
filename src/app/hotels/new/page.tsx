"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
export const dynamic = "force-dynamic";
export default function NewHotelPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Saudi Arabia");
  const [stars, setStars] = useState("5");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr("");

    const { error } = await supabase.from("hotels").insert({
      name,
      city,
      country,
      star_rating: Number(stars || 0),
    });

    if (error) {
      setSaving(false);
      setErr(error.message);
      return;
    }

    router.push("/hotels");
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <a href="/hotels" className="text-blue-600 text-sm">
        &larr; Back to hotels
      </a>

      <h1 className="text-xl font-bold">New Hotel</h1>

      <form
        onSubmit={submit}
        className="border rounded p-4 space-y-4 bg-white"
      >
        {err && (
          <div className="bg-red-100 text-red-700 p-2 text-sm">{err}</div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-1">
            Hotel name *
          </label>
          <input
            className="border rounded w-full p-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1">
              City *
            </label>
            <input
              className="border rounded w-full p-2 text-sm"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              Country
            </label>
            <input
              className="border rounded w-full p-2 text-sm"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            Star rating
          </label>
          <input
            className="border rounded w-full p-2 text-sm"
            value={stars}
            onChange={(e) => setStars(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save hotel"}
        </button>
      </form>
    </div>
  );
}
