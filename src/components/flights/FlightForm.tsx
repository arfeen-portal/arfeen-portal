"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
export default function FlightForm({ existing }: any) {
  const router = useRouter();

  const [airline, setAirline] = useState(existing?.airline || "");
  const [flightNo, setFlightNo] = useState(existing?.flight_no || "");
  const [fromCity, setFromCity] = useState(existing?.from_city || "");
  const [toCity, setToCity] = useState(existing?.to_city || "");
  const [depart, setDepart] = useState(existing?.depart_time || "");
  const [arrive, setArrive] = useState(existing?.arrive_time || "");
  const [price, setPrice] = useState(existing?.base_price || "");
  const [currency, setCurrency] = useState(existing?.currency || "USD");

  const [err, setErr] = useState("");

  const save = async (e: any) => {
    e.preventDefault();
    setErr("");

    const payload = {
      airline,
      flight_no: flightNo,
      from_city: fromCity,
      to_city: toCity,
      depart_time: depart || null,
      arrive_time: arrive || null,
      base_price: price || null,
      currency,
    };

    let q;
    if (existing) {
      q = supabase.from("flight_segments").update(payload).eq("id", existing.id);
    } else {
      q = supabase.from("flight_segments").insert(payload);
    }

    const { error } = await q;

    if (error) return setErr(error.message);

    router.push("/flights");
  };

  return (
    <form onSubmit={save} className="space-y-4 border p-4 rounded">
      {err && <div className="p-2 bg-red-100 text-red-700">{err}</div>}

      <div>
        <label>Airline</label>
        <input
          className="border w-full p-2 rounded"
          value={airline}
          onChange={(e) => setAirline(e.target.value)}
        />
      </div>

      <div>
        <label>Flight No</label>
        <input
          className="border w-full p-2 rounded"
          value={flightNo}
          onChange={(e) => setFlightNo(e.target.value)}
        />
      </div>

      <div>
        <label>From City</label>
        <input
          className="border w-full p-2 rounded"
          value={fromCity}
          onChange={(e) => setFromCity(e.target.value)}
        />
      </div>

      <div>
        <label>To City</label>
        <input
          className="border w-full p-2 rounded"
          value={toCity}
          onChange={(e) => setToCity(e.target.value)}
        />
      </div>

      <div>
        <label>Departure Time</label>
        <input
          type="datetime-local"
          className="border w-full p-2 rounded"
          value={depart}
          onChange={(e) => setDepart(e.target.value)}
        />
      </div>

      <div>
        <label>Arrival Time</label>
        <input
          type="datetime-local"
          className="border w-full p-2 rounded"
          value={arrive}
          onChange={(e) => setArrive(e.target.value)}
        />
      </div>

      <div>
        <label>Price</label>
        <input
          className="border w-full p-2 rounded"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>

      <div>
        <label>Currency</label>
        <input
          className="border w-full p-2 rounded"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        />
      </div>

      <button className="bg-black text-white px-4 py-2 rounded">
        Save
      </button>
    </form>
  );
}
