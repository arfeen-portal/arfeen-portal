"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function NewGroupBatchPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    airline: "",
    from_city: "",
    to_city: "",
    flight_date: "",
    total_seats: "0",
    base_fare: "0",
    tax: "0",
    currency: "PKR",
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    const { error } = await supabase.from("group_ticket_batches").insert({
      name: form.name,
      airline: form.airline,
      from_city: form.from_city,
      to_city: form.to_city,
      flight_date: form.flight_date || null,
      total_seats: Number(form.total_seats || 0),
      base_fare: Number(form.base_fare || 0),
      tax: Number(form.tax || 0),
      currency: form.currency || "PKR",
    });

    if (error) {
      setSaving(false);
      setErrorMsg(error.message);
      return;
    }

    router.push("/group-ticketing");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <a href="/group-ticketing" className="text-blue-600 text-sm">
        &larr; Back to batches
      </a>

      <h1 className="text-xl font-bold">New Ticket Batch</h1>

      <form
        onSubmit={submit}
        className="border rounded p-4 space-y-4 bg-white"
      >
        {errorMsg && (
          <div className="bg-red-100 text-red-700 p-2 text-sm">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-1">
            Batch name *
          </label>
          <input
            className="border rounded w-full p-2 text-sm"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1">
              Airline
            </label>
            <input
              className="border rounded w-full p-2 text-sm"
              value={form.airline}
              onChange={(e) => update("airline", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              From city
            </label>
            <input
              className="border rounded w-full p-2 text-sm"
              value={form.from_city}
              onChange={(e) => update("from_city", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              To city
            </label>
            <input
              className="border rounded w-full p-2 text-sm"
              value={form.to_city}
              onChange={(e) => update("to_city", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1">
              Flight date
            </label>
            <input
              type="date"
              className="border rounded w-full p-2 text-sm"
              value={form.flight_date}
              onChange={(e) => update("flight_date", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              Total seats
            </label>
            <input
              className="border rounded w-full p-2 text-sm"
              value={form.total_seats}
              onChange={(e) => update("total_seats", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1">
              Base fare / pax
            </label>
            <input
              className="border rounded w-full p-2 text-sm"
              value={form.base_fare}
              onChange={(e) => update("base_fare", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              Tax / pax
            </label>
            <input
              className="border rounded w-full p-2 text-sm"
              value={form.tax}
              onChange={(e) => update("tax", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              Currency
            </label>
            <input
              className="border rounded w-full p-2 text-sm"
              value={form.currency}
              onChange={(e) => update("currency", e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save batch"}
        </button>
      </form>
    </div>
  );
}
