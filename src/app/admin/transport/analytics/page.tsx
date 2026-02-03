"use client";

import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import PageHeader from "@/components/layout/PageHeader";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";

type Row = {
  city: string | null;
  pickup_type: string | null;
  pickup_location: string | null;
  drop_type: string | null;
  drop_location: string | null;
};

export default function TransportAnalyticsPage() {
  const supabase = supabaseClient;
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("transport_bookings")
        .select(
          "city, pickup_type, pickup_location, drop_type, drop_location"
        );

      setRows((data as Row[]) ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p>Loading analytics…</p>;

  const total = rows.length || 1;

  const pct = (n: number) => Math.round((n / total) * 100);

  const airportArrivals = rows.filter((r) =>
    r.drop_location?.toLowerCase().includes("airport")
  ).length;

  const airportDepartures = rows.filter((r) =>
    r.pickup_location?.toLowerCase().includes("airport")
  ).length;

  return (
    <div>
      <PageHeader
        title="Transport Analytics"
        subtitle="Arrival / departure and route overview"
      />

      <Pie
        data={{
          labels: ["Arrival", "Departure"],
          datasets: [
            {
              data: [pct(airportArrivals), pct(airportDepartures)],
            },
          ],
        }}
      />
    </div>
  );
}
