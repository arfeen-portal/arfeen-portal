"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
export const dynamic = "force-dynamic";
interface Props {
  params: { id: string };
}

export default function EditFlightPage({ params }: Props) {
  const router = useRouter();
  const flightId = params.id;

  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({
    airline: "",
    flight_no: "",
    from_city: "",
    to_city: "",
    depart_at: "",
    arrive_at: "",
    currency: "PKR",
    base_fare: "0",
    tax: "0",
  });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("flights")
        .select("*")
        .eq("id", flightId)
        .single();

      if (data) {
        setForm({
          airline: data.airline || "",
          flight_no: data.flight_no || "",
          from_city: data.from_city || "",
          to_city: data.to_city || "",
          depart_at: data.depart_at
            ? new Date(data.depart_at).toISOString().slice(0, 16)
            : "",
          arrive_at: data.arrive_at
            ? new Date(data.arrive_at).toISOString().slice(0, 16)
            : "",
          currency: data.currency || "PKR",
          base_fare: String(data.base_fare || "0"),
          tax: String(data.tax || "0"),
        });
      }
      setLoaded(true);
    })();
  }, [flightId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr("");

    const { error } = await supabase
      .from("flights")
      .update({
        airline: form.airline,
        flight_no: form.flight_no,
        from_city: form.from_city,
        to_city: form.to_city,
        depart_at: form.depart_at
          ? new Date(form.depart_at).toISOString()
          : null,
        arrive_at: form.arrive_at
          ? new Date(form.arrive_at).toISOString()
          : null,
        currency: form.currency,
        base_fare: Number(form.base_fare || 0),
        tax: Number(form.tax || 0),
      })
      .eq("id", flightId);

    if (error) {
      setSaving(false);
      setErr(error.message);
      return;
    }

    router.push("/flights");
  };

  if (!loaded) {
    return <div className="p-6">Loading…</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <a href="/flights" className="text-blue-600 text-sm">
        &larr; Back to flights
      </a>

      <h1 className="text-xl font-bold">Edit Flight</h1>

      <form
        onSubmit={submit}
        className="border rounded p-4 space-y-4 bg-white"
      >
        {err && (
          <div className="bg-red-100 text-red-700 p-2 text-sm">{err}</div>
        )}

        {/* same form fields as NewFlightPage */}
        <div className="grid grid-cols-2 gap-3">
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
              Flight no
            </label>
            <input
              className="border rounded w-full p-2 text-sm"
              value={form.flight_no}
              onChange={(e) => update("flight_no", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
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
              Departure (local)
            </label>
            <input
              type="datetime-local"
              className="border rounded w-full p-2 text-sm"
              value={form.depart_at}
              onChange={(e) => update("depart_at", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              Arrival (local)
            </label>
            <input
              type="datetime-local"
              className="border rounded w-full p-2 text-sm"
              value={form.arrive_at}
              onChange={(e) => update("arrive_at", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
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
          <div>
            <label className="block text-sm font-semibold mb-1">
              Base fare
            </label>
            <input
              className="border rounded w-full p-2 text-sm"
              value={form.base_fare}
              onChange={(e) => update("base_fare", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              Tax
            </label>
            <input
              className="border rounded w-full p-2 text-sm"
              value={form.tax}
              onChange={(e) => update("tax", e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-60"
        >
          {saving ? "Saving..." : "Update flight"}
        </button>
      </form>
    </div>
  );
}
