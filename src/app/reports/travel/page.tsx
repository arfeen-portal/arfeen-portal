"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/reports/StatCard";
import BarList from "@/components/reports/BarList";
import SimpleTable from "@/components/reports/SimpleTable";

type TravelResponse = {
  ok: boolean;
  filters: { from: string; to: string };
  kpis: {
    routeBookings: number;
    routePassengers: number;
    routeGrossSales: string;
    activeVehicles: number;
  };
  topRoutes: Array<{
    route_name: string;
    total_bookings: number;
    total_passengers: number;
    gross_sales: number;
    avg_ticket: number;
  }>;
  vehicleBreakdown: Array<{
    vehicle_type: string;
    total_bookings: number;
    total_passengers: number;
    gross_sales: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    total_bookings: number;
    gross_sales: number;
  }>;
  hourlyDistribution: Array<{
    hour_of_day: number;
    total_bookings: number;
  }>;
};

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 29);

  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function fallbackTravelData(from: string, to: string): TravelResponse {
  return {
    ok: true,
    filters: { from, to },
    kpis: {
      routeBookings: 326,
      routePassengers: 1148,
      routeGrossSales: "PKR 18,450,000",
      activeVehicles: 42,
    },
    topRoutes: [
      {
        route_name: "Jeddah Airport → Makkah Hotel",
        total_bookings: 112,
        total_passengers: 384,
        gross_sales: 6850000,
        avg_ticket: 61160,
      },
      {
        route_name: "Makkah Hotel → Madinah Hotel",
        total_bookings: 74,
        total_passengers: 256,
        gross_sales: 4920000,
        avg_ticket: 66486,
      },
      {
        route_name: "Madinah Hotel → Madinah Airport",
        total_bookings: 51,
        total_passengers: 162,
        gross_sales: 2180000,
        avg_ticket: 42745,
      },
    ],
    vehicleBreakdown: [
      {
        vehicle_type: "GMC",
        total_bookings: 96,
        total_passengers: 372,
        gross_sales: 6200000,
      },
      {
        vehicle_type: "Hiace",
        total_bookings: 138,
        total_passengers: 548,
        gross_sales: 7900000,
      },
      {
        vehicle_type: "Coaster",
        total_bookings: 42,
        total_passengers: 168,
        gross_sales: 3150000,
      },
    ],
    statusBreakdown: [
      { status: "Completed", total_bookings: 281, gross_sales: 16100000 },
      { status: "Pending", total_bookings: 29, gross_sales: 1650000 },
      { status: "Cancelled", total_bookings: 16, gross_sales: 700000 },
    ],
    hourlyDistribution: [
      { hour_of_day: 6, total_bookings: 18 },
      { hour_of_day: 9, total_bookings: 44 },
      { hour_of_day: 13, total_bookings: 39 },
      { hour_of_day: 18, total_bookings: 52 },
      { hour_of_day: 22, total_bookings: 31 },
    ],
  };
}

export default function TravelReportsPage() {
  const range = defaultRange();

  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TravelResponse | null>(null);
  const [notice, setNotice] = useState("");

  async function load(currentFrom: string, currentTo: string) {
    try {
      setLoading(true);
      setNotice("");

      const res = await fetch(
        `/api/reports/travel/summary?from=${currentFrom}&to=${currentTo}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        throw new Error("API unavailable");
      }

      const json = (await res.json()) as TravelResponse;
      setData(json);
    } catch {
      setData(fallbackTravelData(currentFrom, currentTo));
      setNotice("Live API unavailable — showing safe demo report data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8">
      <section className="mx-auto max-w-7xl rounded-[32px] bg-white p-8 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-600">
              Travel Operations
            </p>

            <h1 className="mt-3 text-3xl font-black text-slate-950">
              Travel-Specific Reports
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Route performance, vehicle usage, booking timing, passenger
              movement, active vehicles and route-wise gross sales.
            </p>
          </div>

          <button
            type="button"
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
          >
            Export Travel Report
          </button>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
            />

            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
            />

            <button
              type="button"
              onClick={() => load(from, to)}
              className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-bold text-white"
            >
              Apply Filter
            </button>
          </div>
        </div>

        {notice ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
            {notice}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-sm font-semibold text-slate-500">
            Loading travel report...
          </div>
        ) : data ? (
          <>
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Route Bookings"
                value={String(data.kpis.routeBookings)}
              />
              <StatCard
                title="Route Passengers"
                value={String(data.kpis.routePassengers)}
              />
              <StatCard
                title="Route Gross Sales"
                value={data.kpis.routeGrossSales}
              />
              <StatCard
                title="Active Vehicle Types"
                value={String(data.kpis.activeVehicles)}
              />
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
              <BarList
                title="Top Routes by Gross Sales"
                items={data.topRoutes.map((item) => ({
                  label: item.route_name,
                  value: Number(item.gross_sales || 0),
                }))}
              />

              <BarList
                title="Vehicle Type Distribution"
                items={data.vehicleBreakdown.map((item) => ({
                  label: item.vehicle_type,
                  value: Number(item.total_bookings || 0),
                }))}
              />
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
              <SimpleTable
                title="Top Routes"
                columns={[
                  "Route",
                  "Bookings",
                  "Passengers",
                  "Gross Sales",
                  "Avg Ticket",
                ]}
                rows={data.topRoutes.map((item) => [
                  item.route_name,
                  String(item.total_bookings),
                  String(item.total_passengers),
                  `PKR ${Number(item.gross_sales || 0).toFixed(2)}`,
                  `PKR ${Number(item.avg_ticket || 0).toFixed(2)}`,
                ])}
              />

              <SimpleTable
                title="Booking Status Breakdown"
                columns={["Status", "Bookings", "Gross Sales"]}
                rows={data.statusBreakdown.map((item) => [
                  item.status,
                  String(item.total_bookings),
                  `PKR ${Number(item.gross_sales || 0).toFixed(2)}`,
                ])}
              />
            </div>

            <div className="mt-8">
              <SimpleTable
                title="Hourly Booking Distribution"
                columns={["Hour", "Bookings"]}
                rows={data.hourlyDistribution.map((item) => [
                  `${String(item.hour_of_day).padStart(2, "0")}:00`,
                  String(item.total_bookings),
                ])}
              />
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}