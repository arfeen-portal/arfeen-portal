"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LiveTicketSearchPage() {
  const router = useRouter();

  const [from, setFrom] = useState("LHE");
  const [to, setTo] = useState("JED");
  const [date, setDate] = useState("");
  const [pax, setPax] = useState("1");

  const search = (e: any) => {
    e.preventDefault();
    router.push(`/live-tickets/results?from=${from}&to=${to}&date=${date}&pax=${pax}`);
  };

  return (
    <div className="p-6 max-w-lg mx-auto space-y-5">
      <h1 className="text-2xl font-bold">Live Flight Search</h1>

      <form onSubmit={search} className="border p-4 rounded space-y-4">

        <div>
          <label>From</label>
          <input
            className="border w-full p-2 rounded"
            value={from}
            onChange={(e) => setFrom(e.target.value.toUpperCase())}
          />
        </div>

        <div>
          <label>To</label>
          <input
            className="border w-full p-2 rounded"
            value={to}
            onChange={(e) => setTo(e.target.value.toUpperCase())}
          />
        </div>

        <div>
          <label>Departure Date</label>
          <input
            type="date"
            className="border w-full p-2 rounded"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label>Passengers</label>
          <input
            className="border w-full p-2 rounded"
            value={pax}
            onChange={(e) => setPax(e.target.value)}
          />
        </div>

        <button className="bg-black text-white px-4 py-2 rounded">
          Search Flights
        </button>
      </form>
    </div>
  );
}
