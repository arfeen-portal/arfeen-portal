"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function BatchSummary() {
  const { id } = useParams();
  const supabase = createClient();
  const [summary, setSummary] = useState(null);

  const fetchSummary = async () => {
    const { data } = await supabase.rpc("get_batch_profit_summary", {
      batch_id_input: id
    });

    if (data) setSummary(data[0]);
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (!summary) return <div className="p-6">Loading summary...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Batch Summary</h1>

      <div className="p-5 border rounded-lg bg-white shadow space-y-2">
        <p><b>Total Bookings:</b> {summary.total_bookings}</p>
        <p><b>Total Cost:</b> {summary.total_cost} SAR</p>
        <p><b>Total Selling:</b> {summary.total_selling} SAR</p>
        <p><b>Total Profit:</b> {summary.total_profit} SAR</p>
      </div>
    </div>
  );
}
