"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
export default function RuleForm({ existing }: any) {
  const router = useRouter();

  const [name, setName] = useState(existing?.name || "");
  const [visa, setVisa] = useState(existing?.default_visa_price || "");
  const [profit, setProfit] = useState(existing?.default_profit || "");
  const [extraMak, setExtraMak] = useState(existing?.extra_night_price_makkah || "");
  const [extraMad, setExtraMad] = useState(existing?.extra_night_price_madinah || "");
  const [trMark, setTrMark] = useState(existing?.transport_markup || "");
  const [flMark, setFlMark] = useState(existing?.flight_markup || "");
  const [currency, setCurrency] = useState(existing?.currency || "SAR");
  const [isActive, setIsActive] = useState(existing?.is_active || false);

  const [err, setErr] = useState("");

  const save = async (e: any) => {
    e.preventDefault();

    const payload = {
      name,
      default_visa_price: visa,
      default_profit: profit,
      extra_night_price_makkah: extraMak,
      extra_night_price_madinah: extraMad,
      transport_markup: trMark,
      flight_markup: flMark,
      currency,
      is_active: isActive,
    };

    const { error } = await supabase
      .from("umrah_calculator_rules")
      .insert(payload);

    if (error) return setErr(error.message);

    router.push("/calculator/rules");
  };

  return (
    <form onSubmit={save} className="space-y-4 border p-4 rounded">
      {err && <div className="bg-red-100 text-red-700 p-2">{err}</div>}

      <div>
        <label>Name *</label>
        <input
          className="border w-full p-2 rounded"
          value={name}
          required
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Visa price</label>
          <input
            className="border w-full p-2 rounded"
            value={visa}
            onChange={(e) => setVisa(e.target.value)}
          />
        </div>

        <div>
          <label>Profit</label>
          <input
            className="border w-full p-2 rounded"
            value={profit}
            onChange={(e) => setProfit(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Extra night (Makkah)</label>
          <input
            className="border w-full p-2 rounded"
            value={extraMak}
            onChange={(e) => setExtraMak(e.target.value)}
          />
        </div>

        <div>
          <label>Extra night (Madinah)</label>
          <input
            className="border w-full p-2 rounded"
            value={extraMad}
            onChange={(e) => setExtraMad(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label>Transport markup</label>
        <input
          className="border w-full p-2 rounded"
          value={trMark}
          onChange={(e) => setTrMark(e.target.value)}
        />
      </div>

      <div>
        <label>Flight markup</label>
        <input
          className="border w-full p-2 rounded"
          value={flMark}
          onChange={(e) => setFlMark(e.target.value)}
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

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        <label>Active rule</label>
      </div>

      <button className="bg-black text-white px-4 py-2 rounded">
        Save
      </button>
    </form>
  );
}
