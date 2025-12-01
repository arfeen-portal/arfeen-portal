"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import PageHeader from "@/components/layout/PageHeader";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";

type Row = {
  city: string | null;
  pickup_type: string | null;
  pickup_location: string | null;
  drop_type: string | null;
  drop_location: string | null;
};

export default function TransportAnalyticsPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("transport_bookings")
      .select(
        "city, pickup_type, pickup_location, drop_type, drop_location"
      );
    setRows((data as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <div className="p-6">Loading analytics…</div>;

  const total = rows.length || 1; // divide by 0 se bachne ke liye
  const pct = (x: number) => Math.round((x / total) * 100);

  const toLower = (s: string | null) => (s || "").toLowerCase();

  // Arrival: hotel → airport (drop_location me airport)
  const arrival = rows.filter((r) =>
    toLower(r.drop_location).includes("airport")
  ).length;

  // Departure: airport → hotel (pickup_location me airport)
  const departure = rows.filter((r) =>
    toLower(r.pickup_location).includes("airport")
  ).length;

  // Makkah → Madinah (city = makkah, drop_location me madinah)
  const makToMad = rows.filter(
    (r) =>
      toLower(r.city) === "makkah" &&
      toLower(r.drop_location).includes("madinah")
  ).length;

  // Madinah → Makkah (city = madinah, drop_location me makkah)
  const madToMak = rows.filter(
    (r) =>
      toLower(r.city) === "madinah" &&
      toLower(r.drop_location).includes("makkah")
  ).length;

  const taifRoutes = rows.filter((r) =>
    toLower(r.drop_location).includes("taif")
  ).length;

  const ziyaratRoutes = rows.filter((r) =>
    toLower(r.drop_location).includes("ziyarat")
  ).length;

  const trainRoutes = rows.filter((r) =>
    toLower(r.drop_location).includes("station")
  ).length;

  return (
    <div>
      <PageHeader
        title="Transport Analytics"
        subtitle="Arrival/Departure, route mix and special routes overview"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Arrival vs Departure */}
        <div className="bg-white border rounded shadow p-4">
          <h3 className="font-semibold text-sm mb-2">Arrival vs Departure</h3>
          <Pie
            data={{
              labels: ["Arrival", "Departure"],
              datasets: [
                {
                  data: [pct(arrival), pct(departure)],
                },
              ],
            }}
          />
          <p className="text-[11px] text-slate-500 mt-2">
            Total bookings: {rows.length}
          </p>
        </div>

        {/* Makkah ↔ Madinah */}
        <div className="bg-white border rounded shadow p-4">
          <h3 className="font-semibold text-sm mb-2">Makkah ↔ Madinah</h3>
          <Pie
            data={{
              labels: ["Makkah → Madinah", "Madinah → Makkah"],
              datasets: [
                {
                  data: [pct(makToMad), pct(madToMak)],
                },
              ],
            }}
          />
        </div>

        {/* Ziyarat / Taif / Train */}
        <div className="bg-white border rounded shadow p-4">
          <h3 className="font-semibold text-sm mb-2">Ziyarat / Taif / Train</h3>
          <Pie
            data={{
              labels: ["Ziyarat", "Taif", "Train"],
              datasets: [
                {
                  data: [pct(ziyaratRoutes), pct(taifRoutes), pct(trainRoutes)],
                },
              ],
            }}
          />
        </div>

        {/* Simple totals card */}
        <div className="bg-white border rounded shadow p-4 flex flex-col justify-center">
          <h3 className="font-semibold text-sm mb-2">Totals</h3>
          <p className="text-xs text-slate-600">
            Total bookings: <span className="font-semibold">{rows.length}</span>
          </p>
          <p className="text-xs text-slate-600">
            Taif routes: <span className="font-semibold">{taifRoutes}</span>
          </p>
          <p className="text-xs text-slate-600">
            Ziyarat routes: <span className="font-semibold">{ziyaratRoutes}</span>
          </p>
          <p className="text-xs text-slate-600">
            Train routes: <span className="font-semibold">{trainRoutes}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
