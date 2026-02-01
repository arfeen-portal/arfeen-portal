"use client";

import { useState } from "react";
import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

import { useRouter } from "next/navigation";
export default function BatchForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [airline, setAirline] = useState("");
  const [flightDate, setFlightDate] = useState("");
  const [tickets, setTickets] = useState("");
  const [fare, setFare] = useState("");
  const [err, setErr] = useState("");

  const save = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.from("group_ticket_batches").insert({
      name, airline, flight_date: flightDate,
      total_tickets: tickets, base_fare: fare
    });

    if (error) return setErr(error.message);
    router.push("/group-ticketing");
  };

  return (
    <form onSubmit={save} className="space-y-4 border p-4 rounded">

      {err && <div className="bg-red-100 text-red-700 p-2">{err}</div>}

      <div>
        <label>Name</label>
        <input className="border w-full p-2 rounded" value={name} onChange={(e)=>setName(e.target.value)} />
      </div>

      <div>
        <label>Airline</label>
        <input className="border w-full p-2 rounded" value={airline} onChange={(e)=>setAirline(e.target.value)} />
      </div>

      <div>
        <label>Flight Date</label>
        <input type="date" className="border w-full p-2 rounded" value={flightDate} onChange={(e)=>setFlightDate(e.target.value)} />
      </div>

      <div>
        <label>Total Tickets</label>
        <input className="border w-full p-2 rounded" value={tickets} onChange={(e)=>setTickets(e.target.value)} />
      </div>

      <div>
        <label>Base Fare per Ticket</label>
        <input className="border w-full p-2 rounded" value={fare} onChange={(e)=>setFare(e.target.value)} />
      </div>

      <button className="bg-black text-white px-4 py-2 rounded">Save</button>
    </form>
  );
}
