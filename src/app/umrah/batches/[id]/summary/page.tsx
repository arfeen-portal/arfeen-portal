"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

type BatchSummary = {
  total_bookings: number;
  total_cost: number;
  total_selling: number;
  total_profit: number;
};

export default function BatchSummary() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const supabase = supabaseClient;
  const [summary, setSummary] = useState<BatchSummary | null>(null);

  const fetchSummary = async () => {
    if (!id) return;

    const { data } = await supabase.rpc("get_batch_profit_summary", {
      batch_id_input: id,
    });

    if (Array.isArray(data) && data.length > 0) {
      setSummary(data[0] as BatchSummary);
    } else if (data) {
      setSummary(data as BatchSummary);
    }
  };

  useEffect(() => {
    void fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!summary) {
    return <div className="p-6">Loading summary...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Batch Summary</h1>

      <div className="p-5 border rounded-lg bg-white shadow space-y-2">
        <p>
          <b>Total Bookings:</b> {summary.total_bookings}
        </p>
        <p>
          <b>Total Cost:</b> {summary.total_cost} SAR
        </p>
        <p>
          <b>Total Selling:</b> {summary.total_selling} SAR
        </p>
        <p>
          <b>Total Profit:</b> {summary.total_profit} SAR
        </p>
      </div>
    </div>
  );
}