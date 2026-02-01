"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

import { useRouter } from "next/navigation";
export default function PackageHotelForm({ packageId }: any) {
  const router = useRouter();

  const [hotels, setHotels] = useState<any[]>([]);
  const [hotelId, setHotelId] = useState("");
  const [nights, setNights] = useState("0");
  const [price, setPrice] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("hotel_properties")
        .select("*")
        .order("name");

      setHotels(data || []);
    })();
  }, []);

  const save = async (e: any) => {
    e.preventDefault();
    setErr("");

    const { error } = await supabase.from("umrah_package_hotels").insert({
      package_id: packageId,
      hotel_id: hotelId,
      nights: Number(nights),
      price_per_night: price || null,
      sort_order: Number(sortOrder),
      notes,
    });

    if (error) return setErr(error.message);

    router.push(`/umrah/packages/${packageId}/hotels`);
  };

  return (
    <form onSubmit={save} className="border p-4 space-y-4 rounded">
      {err && <div className="bg-red-100 text-red-700 p-2">{err}</div>}

      <div>
        <label className="font-semibold text-sm">Select hotel *</label>
        <select
          className="border w-full p-2 rounded"
          value={hotelId}
          onChange={(e) => setHotelId(e.target.value)}
          required
        >
          <option value="">-- Select --</option>
          {hotels.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name} ({h.city})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Nights</label>
        <input
          className="border w-full p-2 rounded"
          value={nights}
          onChange={(e) => setNights(e.target.value)}
        />
      </div>

      <div>
        <label>Rate per night</label>
        <input
          className="border w-full p-2 rounded"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
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
