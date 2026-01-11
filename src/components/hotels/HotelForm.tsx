"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
export default function HotelForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [rating, setRating] = useState("");
  const [price, setPrice] = useState("");

  const [err, setErr] = useState("");

  const save = async (e: any) => {
    e.preventDefault();
    setErr("");

    const { error } = await supabase.from("hotel_properties").insert({
      name,
      city,
      rating: rating || null,
      default_price: price || null,
    });

    if (error) return setErr(error.message);

    router.push("/hotels");
  };

  return (
    <form onSubmit={save} className="space-y-4 border p-4 rounded">
      {err && <div className="p-2 bg-red-100 text-red-700">{err}</div>}

      <div>
        <label>Name *</label>
        <input
          className="border w-full p-2 rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div>
        <label>City *</label>
        <input
          className="border w-full p-2 rounded"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Rating</label>
        <input
          className="border w-full p-2 rounded"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
        />
      </div>

      <div>
        <label>Default Price</label>
        <input
          className="border w-full p-2 rounded"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>

      <button className="bg-black text-white px-4 py-2 rounded">
        Save
      </button>
    </form>
  );
}
