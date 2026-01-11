"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
export default function PackageFlightForm({ packageId }: any) {
  const router = useRouter();

  const [flights, setFlights] = useState<any[]>([]);
  const [flightId, setFlightId] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("flight_segments")
        .select("*")
        .order("airline");

      setFlights(data || []);
    })();
  }, []);

  const save = async (e: any) => {
    e.preventDefault();
    setErr("");

    const { error } = await supabase.from("umrah_package_flights").insert({
      package_id: packageId,
      segment_id: flightId,
      sort_order: Number(sortOrder),
      notes,
    });

    if (error) return setErr(error.message);

    router.push(`/umrah/packages/${packageId}/flights`);
  };

  return (
    <form onSubmit={save} className="border p-4 rounded space-y-4">
      {err && <div className="bg-red-100 text-red-700 p-2">{err}</div>}

      <div>
        <label className="font-semibold text-sm">Select flight *</label>
        <select
          className="border w-full p-2 rounded"
          value={flightId}
          onChange={(e) => setFlightId(e.target.value)}
          required
        >
          <option value="">-- Select --</option>
          {flights.map((f) => (
            <option key={f.id} value={f.id}>
              {f.airline} {f.flight_no} ({f.from_city} → {f.to_city})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Sort order</label>
        <input
          className="border w-full p-2 rounded"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        />
      </div>

      <div>
        <label>Notes</label>
        <textarea
          className="border w-full p-2 rounded"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <button className="bg-black text-white px-4 py-2 rounded">
        Save
      </button>
    </form>
  );
}
