"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface Props {
  params: { id: string };
}

export default function LinkHotelToPackagePage({ params }: Props) {
  const packageId = params.id;
  const router = useRouter();

  const [hotels, setHotels] = useState<any[]>([]);
  const [hotelId, setHotelId] = useState("");
  const [nights, setNights] = useState("3");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("hotels").select("*").order("city");
      setHotels(data || []);
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr("");

    const { error } = await supabase.from("umrah_package_hotels").insert({
      package_id: packageId,
      hotel_id: hotelId,
      nights: Number(nights || 0),
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

      <h1 className="text-xl font-bold">Attach Hotel to Package</h1>

      <form
        onSubmit={submit}
        className="border rounded p-4 space-y-4 bg-white"
      >
        {err && (
          <div className="bg-red-100 text-red-700 p-2 text-sm">{err}</div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-1">
            Hotel *
          </label>
          <select
            className="border rounded w-full p-2 text-sm"
            value={hotelId}
            onChange={(e) => setHotelId(e.target.value)}
            required
          >
            <option value="">-- Select hotel --</option>
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.city})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1">Nights</label>
          <input
            className="border rounded w-full p-2 text-sm"
            value={nights}
            onChange={(e) => setNights(e.target.value)}
          />
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
