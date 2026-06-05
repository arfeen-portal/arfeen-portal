"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

type CalculatorRules = {
  id?: string;
  transport_markup: number;
  flight_markup: number;
  default_visa_price: number;
  default_profit: number;
};

export default function CalculatorForm() {
  const [rules, setRules] = useState<CalculatorRules | null>(null);

  const [mkk, setMkk] = useState<string>("5");
  const [mdn, setMdn] = useState<string>("5");
  const [hotelMkk, setHotelMkk] = useState<string>("200");
  const [hotelMdn, setHotelMdn] = useState<string>("150");
  const [transport, setTransport] = useState<string>("300");
  const [flight, setFlight] = useState<string>("800");

  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadRules() {
      try {
        setLoading(true);

        const { data, error } = await supabaseClient
          .from("umrah_calculator_rules")
          .select("*")
          .eq("is_active", true)
          .limit(1)
          .single();

        if (error) {
          console.error("Rules fetch error:", error);
          return;
        }

        if (data) {
          setRules(data as CalculatorRules);
        }
      } catch (err) {
        console.error("Unexpected rules error:", err);
      } finally {
        setLoading(false);
      }
    }

    void loadRules();
  }, []);

  const calc = () => {
    if (rules === null) return;

    const totalHotel =
      Number(mkk) * Number(hotelMkk) +
      Number(mdn) * Number(hotelMdn);

    const totalTransport =
      Number(transport) +
      Number(rules.transport_markup ?? 0);

    const totalFlight =
      Number(flight) +
      Number(rules.flight_markup ?? 0);

    const final =
      totalHotel +
      totalTransport +
      totalFlight +
      Number(rules.default_visa_price ?? 0) +
      Number(rules.default_profit ?? 0);

    setPrice(final);
  };

  return (
    <div className="border rounded-xl p-5 bg-white shadow-sm space-y-5">
      <h2 className="text-xl font-bold">
        Umrah Price Calculator
      </h2>

      {loading && (
        <div className="text-gray-500">
          Loading rules...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium">
            Makkah Nights
          </label>
          <input
            className="border rounded p-2 w-full"
            value={mkk}
            onChange={(e) => setMkk(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Madinah Nights
          </label>
          <input
            className="border rounded p-2 w-full"
            value={mdn}
            onChange={(e) => setMdn(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Makkah Hotel Rate
          </label>
          <input
            className="border rounded p-2 w-full"
            value={hotelMkk}
            onChange={(e) =>
              setHotelMkk(e.target.value)
            }
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Madinah Hotel Rate
          </label>
          <input
            className="border rounded p-2 w-full"
            value={hotelMdn}
            onChange={(e) =>
              setHotelMdn(e.target.value)
            }
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Transport Cost
          </label>
          <input
            className="border rounded p-2 w-full"
            value={transport}
            onChange={(e) =>
              setTransport(e.target.value)
            }
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Flight Cost
          </label>
          <input
            className="border rounded p-2 w-full"
            value={flight}
            onChange={(e) =>
              setFlight(e.target.value)
            }
          />
        </div>
      </div>

      <button
        type="button"
        onClick={calc}
        disabled={loading || rules === null}
        className="bg-black text-white px-5 py-2 rounded-lg disabled:opacity-50"
      >
        Calculate
      </button>

      {price !== null && (
        <div className="p-4 rounded-lg bg-green-100 text-green-700 font-semibold">
          Final Price: {price} SAR
        </div>
      )}
    </div>
  );
}