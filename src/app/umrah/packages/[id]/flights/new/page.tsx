"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
interface Props {
  params: { id: string };
}

export default function LinkFlightToPackagePage({ params }: Props) {
  const packageId = params.id;
  const router = useRouter();

  const [flights, setFlights] = useState<any[]>([]);
  const [flightId, setFlightId] = useState("");
  const [direction, setDirection] = useState<"outbound" | "inbound">(
    "outbound"
  );
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("flights")
        .select("*")
        .order("depart_at", { ascending: true });
      setFlights(data || []);
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr("");

    const { error } = await supabase.from("umrah_package_flights").insert({
      package_id: packageId,
      flight_id: flightId,
      direction,
    });

    if (error) {
      setSaving(false);
      setErr(error.message);
      return;
    }

    router.push(`/umrah/packages/${packageId}`);
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <a
        href={`/umrah/packages/${packageId}`}
        className="text-blue-600 text-sm"
      >
        &larr; Back to package
      </a>

      <h1 className="text-xl font-bold">Attach Flight to Package</h1>

      <form
        onSubmit={submit}
        className="border rounded p-4 space-y-4 bg-white"
      >
        {err && (
          <div className="bg-red-100 text-red-700 p-2 text-sm">{err}</div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-1">
            Flight *
          </label>
          <select
            className="border rounded w-full p-2 text-sm"
            value={flightId}
            onChange={(e) => setFlightId(e.target.value)}
            required
          >
            <option value="">-- Select flight --</option>
            {flights.map((f) => (
              <option key={f.id} value={f.id}>
                {f.airline} {f.flight_no} – {f.from_city} → {f.to_city}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">
            Direction
          </label>
          <select
            className="border rounded w-full p-2 text-sm"
            value={direction}
            onChange={(e) =>
              setDirection(e.target.value as "outbound" | "inbound")
            }
          >
            <option value="outbound">Outbound</option>
            <option value="inbound">Inbound</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-black text-white px-4 py-2 rounded text-sm disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save link"}
        </button>
      </form>
    </div>
  );
}
