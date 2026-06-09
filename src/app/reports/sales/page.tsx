"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/reports/StatCard";
import BarList from "@/components/reports/BarList";
import SimpleTable from "@/components/reports/SimpleTable";

type SalesResponse = {
  ok: boolean;
  filters: { from: string; to: string };
  kpis: {
    totalBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    totalPassengers: number;
    grossSales: string;
    totalCommission: string;
    netSales: string;
    avgBookingValue: string;
  };
  daily: Array<{
    report_date: string;
    total_bookings: number;
    confirmed_bookings: number;
    cancelled_bookings: number;
    total_passengers: number;
    gross_sales: number;
    total_commission: number;
    net_sales: number;
    avg_booking_value: number;
  }>;
  topAgents: Array<{
    agent_name: string;
    total_bookings: number;
    total_passengers: number;
    gross_sales: number;
    total_commission: number;
    net_sales: number;
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

function fallbackSalesData(from: string, to: string): SalesResponse {
  return {
    ok: true,
    filters: { from, to },
    kpis: {
      totalBookings: 186,
      confirmedBookings: 164,
      cancelledBookings: 9,
      totalPassengers: 642,
      grossSales: "PKR 31,840,000",
      totalCommission: "PKR 2,145,000",
      netSales: "PKR 29,695,000",
      avgBookingValue: "PKR 171,182",
    },
    daily: [
      {
        report_date: "2026-05-01",
        total_bookings: 21,
        confirmed_bookings: 19,
        cancelled_bookings: 1,
        total_passengers: 78,
        gross_sales: 3450000,
        total_commission: 230000,
        net_sales: 3220000,
        avg_booking_value: 164285,
      },
      {
        report_date: "2026-05-02",
        total_bookings: 28,
        confirmed_bookings: 25,
        cancelled_bookings: 2,
        total_passengers: 94,
        gross_sales: 4820000,
        total_commission: 315000,
        net_sales: 4505000,
        avg_booking_value: 172142,
      },
      {
        report_date: "2026-05-03",
        total_bookings: 33,
        confirmed_bookings: 30,
        cancelled_bookings: 1,
        total_passengers: 126,
        gross_sales: 5960000,
        total_commission: 390000,
        net_sales: 5570000,
        avg_booking_value: 180606,
      },
    ],
    topAgents: [
      {
        agent_name: "Al Noor Travels",
        total_bookings: 42,
        total_passengers: 156,
        gross_sales: 7240000,
        total_commission: 543000,
        net_sales: 6697000,
      },
      {
        agent_name: "Makkah Link",
        total_bookings: 31,
        total_passengers: 118,
        gross_sales: 4890000,
        total_commission: 368000,
        net_sales: 4522000,
      },
      {
        agent_name: "Haram Express",
        total_bookings: 27,
        total_passengers: 91,
        gross_sales: 3920000,
        total_commission: 291000,
        net_sales: 3629000,
      },
    ],
  };
}

export default function SalesReportsPage() {
  const range = defaultRange();

  const [from, setFrom] = useState(range.from);
  const [to, setTo] = useState(range.to);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SalesResponse | null>(null);
  const [notice, setNotice] = useState("");

  async function load(currentFrom: string, currentTo: string) {
    try {
      setLoading(true);
      setNotice("");

      const res = await fetch(
        `/api/reports/sales/summary?from=${currentFrom}&to=${currentTo}`,
        { cache: "no-store" }
      );

      if (!res.ok) throw new Error("API unavailable");

      const json = await res.json();
      setData(json);
    } catch {
      setData(fallbackSalesData(currentFrom, currentTo));
      setNotice("Live API unavailable — showing safe demo report data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(from, to);
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8">
      <section className="mx-auto max-w-7xl rounded-[32px] bg-white p-8 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">
              Sales Intelligence
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-950">
              Sales Reports
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Booking sales, revenue, commission, agent performance, net sales,
              daily trends and average booking value.
            </p>
          </div>

          <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">
            Export Sales Report
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
            Loading sales report...
          </div>
        ) : data ? (
          <>
            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Total Bookings" value={data.kpis.totalBookings} />
              <StatCard title="Gross Sales" value={data.kpis.grossSales} />
              <StatCard title="Commission" value={data.kpis.totalCommission} />
              <StatCard title="Net Sales" value={data.kpis.netSales} />
              <StatCard title="Confirmed" value={data.kpis.confirmedBookings} />
              <StatCard title="Cancelled" value={data.kpis.cancelledBookings} />
              <StatCard title="Passengers" value={data.kpis.totalPassengers} />
              <StatCard title="Avg Booking Value" value={data.kpis.avgBookingValue} />
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
              <BarList
                title="Top Agents by Gross Sales"
                items={data.topAgents.map((item) => ({
                  label: item.agent_name,
                  value: Number(item.gross_sales || 0),
                }))}
              />

              <BarList
                title="Daily Booking Trend"
                items={data.daily.map((item) => ({
                  label: item.report_date,
                  value: Number(item.total_bookings || 0),
                }))}
              />
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
              <SimpleTable
                title="Top Agents"
                columns={[
                  "Agent",
                  "Bookings",
                  "Passengers",
                  "Gross Sales",
                  "Commission",
                  "Net Sales",
                ]}
                rows={data.topAgents.map((item) => [
                  item.agent_name,
                  item.total_bookings,
                  item.total_passengers,
                  `PKR ${Number(item.gross_sales || 0).toFixed(2)}`,
                  `PKR ${Number(item.total_commission || 0).toFixed(2)}`,
                  `PKR ${Number(item.net_sales || 0).toFixed(2)}`,
                ])}
              />

              <SimpleTable
                title="Daily Sales Summary"
                columns={[
                  "Date",
                  "Bookings",
                  "Confirmed",
                  "Cancelled",
                  "Passengers",
                  "Gross Sales",
                  "Commission",
                  "Net Sales",
                ]}
                rows={data.daily.map((item) => [
                  item.report_date,
                  item.total_bookings,
                  item.confirmed_bookings,
                  item.cancelled_bookings,
                  item.total_passengers,
                  `PKR ${Number(item.gross_sales || 0).toFixed(2)}`,
                  `PKR ${Number(item.total_commission || 0).toFixed(2)}`,
                  `PKR ${Number(item.net_sales || 0).toFixed(2)}`,
                ])}
              />
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}