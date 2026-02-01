"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

export default function CalculatorForm() {
  const [rules, setRules] = useState(null);
  const [nMak, setNMak] = useState("5");
  const [nMad, setNMad] = useState("5");
  const [hotelMak, setHotelMak] = useState("200");
  const [hotelMad, setHotelMad] = useState("150");
  const [transport, setTransport] = useState("300");
  const [flight, setFlight] = useState("800");
  const [price, setPrice] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("umrah_calculator_rules")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .single();

      setRules(data);
    })();
  }, []);

  const calc = () => {
    if (!rules) return;

    const totalHotel =
      Number(nMak) * Number(hotelMak) +
      Number(nMad) * Number(hotelMad);

    const totalTransport =
      Number(transport) + Number(rules.transport_markup || 0);

    const totalFlight =
      Number(flight) + Number(rules.flight_markup || 0);

    const final =
      totalHotel +
      totalTransport +
      totalFlight +
      Number(rules.default_visa_price) +
      Number(rules.default_profit);

    setPrice(final);
  };

  return (
    <div className="border p-4 rounded space-y-4">
      {!rules && <p>Loading rules...</p>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Makkah nights</label>
          <input
            className="border w-full p-2 rounded"
            value={nMak}
            onChange={(e) => setNMak(e.target.value)}
          />
        </div>

        <div>
          <label>Madinah nights</label>
          <input
            className="border w-full p-2 rounded"
            value={nMad}
            onChange={(e) => setNMad(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label>Makkah hotel rate</label>
        <input
          className="border w-full p-2 rounded"
          value={hotelMak}
          onChange={(e) => setHotelMak(e.target.value)}
        />
      </div>

      <div>
        <label>Madinah hotel rate</label>
        <input
          className="border w-full p-2 rounded"
          value={hotelMad}
          onChange={(e) => setHotelMad(e.target.value)}
        />
      </div>

      <div>
        <label>Transport cost</label>
        <input
          className="border w-full p-2 rounded"
          value={transport}
          onChange={(e) => setTransport(e.target.value)}
        />
      </div>

      <div>
        <label>Flight cost</label>
        <input
          className="border w-full p-2 rounded"
          value={flight}
          onChange={(e) => setFlight(e.target.value)}
        />
      </div>

      <button
        onClick={calc}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Calculate
      </button>

      {price && (
        <div className="p-3 bg-green-100 text-green-700 rounded">
          Final Price: {price} SAR
        </div>
      )}
    </div>
  );
}
