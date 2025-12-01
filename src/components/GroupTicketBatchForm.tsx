"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function GroupTicketBatchForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [airline, setAirline] = useState("");
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [seatCount, setSeatCount] = useState("0");
  const [baseFare, setBaseFare] = useState("0");
  const [currency, setCurrency] = useState("PKR");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setErrorMsg("");

    const { error } = await supabase.from("group_ticket_batches").insert({
      name,
      airline,
      from_city: fromCity,
      to_city: toCity,
      depart_date: departDate || null,
      return_date: returnDate || null,
      seat_count: Number(seatCount) || null,
      base_fare: Number(baseFare) || null,
      currency,
      notes,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    router.push("/group-tickets");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 border rounded p-4">
      {errorMsg && (
        <div className="bg-red-50 border border-red-300 text-red-700 p-2 text-sm rounded">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold mb-1">Name *</label>
          <input
            className="w-full border rounded px-2 py-1 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Airline</label>
          <input
            className="w-full border rounded px-2 py-1 text-sm"
            value={airline}
            onChange={(e) => setAirline(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">From city</label>
          <input
            className="w-full border rounded px-2 py-1 text-sm"
            value={fromCity}
            onChange={(e) => setFromCity(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">To city</label>
          <input
            className="w-full border rounded px-2 py-1 text-sm"
            value={toCity}
            onChange={(e) => setToCity(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">
            Depart date
          </label>
          <input
            type="date"
            className="w-full border rounded px-2 py-1 text-sm"
            value={departDate}
            onChange={(e) => setDepartDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">
            Return date
          </label>
          <input
            type="date"
            className="w-full border rounded px-2 py-1 text-sm"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">
            Seat count
          </label>
          <input
            type="number"
            className="w-full border rounded px-2 py-1 text-sm"
            value={seatCount}
            onChange={(e) => setSeatCount(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">
            Base fare
          </label>
          <input
            type="number"
            className="w-full border rounded px-2 py-1 text-sm"
            value={baseFare}
            onChange={(e) => setBaseFare(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">
            Currency
          </label>
          <input
            className="w-full border rounded px-2 py-1 text-sm"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1">Notes</label>
        <textarea
          className="w-full border rounded px-2 py-1 text-sm min-h-[60px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="px-3 py-2 bg-black text-white text-sm rounded hover:bg-gray-800"
      >
        Save batch
      </button>
    </form>
  );
}
