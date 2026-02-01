"use client";

import { useState } from "react";
import { getSupabaseClient } from '@/lib/supabaseClient';

const supabase = getSupabaseClient();

import { useRouter } from "next/navigation";
export default function BookingForm({ batchId }: any) {
  const router = useRouter();

  const [agent, setAgent] = useState("");
  const [tickets, setTickets] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [err, setErr] = useState("");

  const save = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.from("group_ticket_batch_bookings").insert({
      batch_id: batchId,
      agent_name: agent,
      tickets,
      selling_price_per_ticket: sellPrice,
    });

    if (error) return setErr(error.message);

    router.push(`/group-ticketing/${batchId}`);
  };

  return (
    <form onSubmit={save} className="border p-4 rounded space-y-4">

      {err && <div className="bg-red-100 text-red-700 p-2">{err}</div>}

      <div>
        <label>Agent Name</label>
        <input
          className="border w-full p-2 rounded"
          value={agent}
          onChange={(e) => setAgent(e.target.value)}
        />
      </div>

      <div>
        <label>No. of Tickets</label>
        <input
          className="border w-full p-2 rounded"
          value={tickets}
          onChange={(e) => setTickets(e.target.value)}
        />
      </div>

      <div>
        <label>Selling Price Per Ticket</label>
        <input
          className="border w-full p-2 rounded"
          value={sellPrice}
          onChange={(e) => setSellPrice(e.target.value)}
        />
      </div>

      <button className="bg-black text-white px-4 py-2 rounded">Save</button>
    </form>
  );
}
