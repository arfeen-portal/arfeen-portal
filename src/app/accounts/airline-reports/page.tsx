"use client";

import { useEffect, useMemo, useState } from "react";

type Sale = {
  id: string;
  ticket_no: string;
  pnr?: string | null;
  passenger_name?: string | null;
  airline?: string | null;
  sector?: string | null;
  supplier_name?: string | null;
  travel_date?: string | null;
  selling_price?: number;
  base_fare?: number;
  airline_commission?: number;
  supplier_cost?: number;
  taxes?: number;
  settlement_status?: string;
  payment_status?: string;
  refund_status?: string;
  notes?: string | null;
  computed_profit?: number;
  profit_status?: string;
};

type Summary = {
  totalTickets: number;
  totalSales: number;
  totalCommission: number;
  totalSupplierCost: number;
  totalTaxes: number;
  profit: number;
  settled: number;
  pending: number;
  lossTickets: number;
};

const emptyForm = {
  ticket_no: "",
  pnr: "",
  passenger_name: "",
  airline: "",
  sector: "",
  supplier_name: "",
  travel_date: "",
  selling_price: "",
  base_fare: "",
  airline_commission: "",
  supplier_cost: "",
  taxes: "",
  settlement_status: "pending",
  payment_status: "unpaid",
  refund_status: "none",
  notes: "",
};

function money(v: unknown) {
  return new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0,
  }).format(Number(v || 0));
}

function profitClass(v: number) {
  if (v < 0) return "bg-red-50 text-red-700 border-red-200";
  if (v <= 1000) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
}

function badgeClass(status?: string) {
  if (status === "settled" || status === "paid") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (status === "refunded" || status === "loss") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  return "bg-amber-50 text-amber-700 border-amber-200";
}

export default function AirlineReportsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalTickets: 0,
    totalSales: 0,
    totalCommission: 0,
    totalSupplierCost: 0,
    totalTaxes: 0,
    profit: 0,
    settled: 0,
    pending: 0,
    lossTickets: 0,
  });

  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [airline, setAirline] = useState("all");
  const [status, setStatus] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const dateFilter = useMemo(() => {
    const today = new Date();
    const to = today.toISOString().slice(0, 10);

    if (dateRange === "7d") {
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      return { from: d.toISOString().slice(0, 10), to };
    }

    if (dateRange === "30d") {
      const d = new Date(today);
      d.setDate(d.getDate() - 30);
      return { from: d.toISOString().slice(0, 10), to };
    }

    if (dateRange === "90d") {
      const d = new Date(today);
      d.setDate(d.getDate() - 90);
      return { from: d.toISOString().slice(0, 10), to };
    }

    return { from: "", to: "" };
  }, [dateRange]);

  async function fetchData() {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (airline !== "all") params.set("airline", airline);
    if (status !== "all") params.set("status", status);
    if (dateFilter.from) params.set("from", dateFilter.from);
    if (dateFilter.to) params.set("to", dateFilter.to);

    const res = await fetch(`/api/accounts/airline-reports?${params.toString()}`, {
      cache: "no-store",
    });

    const json = await res.json();

    if (!res.ok || !json.ok) {
      setError(json.error || "Failed to load airline reports.");
      setLoading(false);
      return;
    }

    setSales(json.sales || []);
    setSummary(json.summary || summary);
    setLoading(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, airline, status, dateRange]);

  async function createSale(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/accounts/airline-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await res.json();

    if (!res.ok || !json.ok) {
      setError(json.error || "Failed to save ticket entry.");
      setSaving(false);
      return;
    }

    setForm(emptyForm);
    await fetchData();
    setSaving(false);
  }

  async function markSettled(id: string) {
    await fetch("/api/accounts/airline-reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        settlement_status: "settled",
        payment_status: "paid",
      }),
    });

    fetchData();
  }

  function exportCSV() {
    const header = [
      "Ticket No",
      "PNR",
      "Passenger",
      "Airline",
      "Sector",
      "Supplier",
      "Travel Date",
      "Selling Price",
      "Commission",
      "Supplier Cost",
      "Taxes",
      "Profit",
      "Settlement",
      "Payment",
    ];

    const rows = sales.map((s) => [
      s.ticket_no,
      s.pnr || "",
      s.passenger_name || "",
      s.airline || "",
      s.sector || "",
      s.supplier_name || "",
      s.travel_date || "",
      s.selling_price || 0,
      s.airline_commission || 0,
      s.supplier_cost || 0,
      s.taxes || 0,
      s.computed_profit || 0,
      s.settlement_status || "",
      s.payment_status || "",
    ]);

    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "airline-bsp-report.csv";
    a.click();

    URL.revokeObjectURL(url);
  }

  const airlines = useMemo(() => {
    return Array.from(new Set(sales.map((s) => s.airline).filter(Boolean))) as string[];
  }, [sales]);

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-2xl">
          <div className="grid gap-6 p-6 md:grid-cols-[1.5fr_1fr] md:p-8">
            <div>
              <p className="mb-3 inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-blue-100">
                Airline / BSP Control Center
              </p>
              <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                BSP & Airline Intelligence
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Ticket profitability, airline settlement, supplier cost, commission,
                tax leakage, refund control aur pending reconciliation ko aik dashboard
                mein manage karein.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm text-slate-300">Net Profit Formula</p>
              <p className="mt-2 text-lg font-black text-white">
                Selling Price + Commission - Supplier Cost - Taxes
              </p>
              <p className="mt-3 text-xs leading-5 text-slate-400">
                Yeh formula airline reporting ke liye zyada accurate hai kyun ke
                commission ko income aur supplier/taxes ko cost treat karta hai.
              </p>
            </div>
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Total Tickets</p>
            <p className="mt-2 text-3xl font-black text-slate-900">
              {summary.totalTickets}
            </p>
          </div>

          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Total Sales</p>
            <p className="mt-2 text-3xl font-black text-slate-900">
              PKR {money(summary.totalSales)}
            </p>
          </div>

          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Net Profit</p>
            <p
              className={`mt-2 text-3xl font-black ${
                summary.profit < 0 ? "text-red-600" : "text-emerald-600"
              }`}
            >
              PKR {money(summary.profit)}
            </p>
          </div>

          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Pending Settlement</p>
            <p className="mt-2 text-3xl font-black text-amber-600">
              {summary.pending}
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <form
            onSubmit={createSale}
            className="rounded-3xl border bg-white p-5 shadow-sm md:p-6"
          >
            <div className="mb-5">
              <h2 className="text-xl font-black text-slate-900">Add Ticket Details</h2>
              <p className="mt-1 text-sm text-slate-500">
                Airline ticket, BSP, supplier cost aur settlement entry.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="md:col-span-2 rounded-2xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="Ticket No *"
                value={form.ticket_no}
                onChange={(e) => setForm({ ...form, ticket_no: e.target.value })}
              />

              <input
                className="rounded-2xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="PNR"
                value={form.pnr}
                onChange={(e) => setForm({ ...form, pnr: e.target.value })}
              />

              <input
                className="rounded-2xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="Passenger Name"
                value={form.passenger_name}
                onChange={(e) =>
                  setForm({ ...form, passenger_name: e.target.value })
                }
              />

              <input
                className="rounded-2xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="Airline e.g. SV"
                value={form.airline}
                onChange={(e) => setForm({ ...form, airline: e.target.value })}
              />

              <input
                className="rounded-2xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="Sector e.g. LHE-JED"
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
              />

              <input
                className="rounded-2xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="Supplier"
                value={form.supplier_name}
                onChange={(e) =>
                  setForm({ ...form, supplier_name: e.target.value })
                }
              />

              <input
                className="rounded-2xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
                type="date"
                value={form.travel_date}
                onChange={(e) => setForm({ ...form, travel_date: e.target.value })}
              />
            </div>

            <div className="mt-4 grid gap-3 rounded-3xl bg-slate-50 p-4 md:grid-cols-2">
              <input
                className="rounded-2xl border bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                type="number"
                placeholder="Selling Price"
                value={form.selling_price}
                onChange={(e) =>
                  setForm({ ...form, selling_price: e.target.value })
                }
              />

              <input
                className="rounded-2xl border bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                type="number"
                placeholder="Base Fare"
                value={form.base_fare}
                onChange={(e) => setForm({ ...form, base_fare: e.target.value })}
              />

              <input
                className="rounded-2xl border bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                type="number"
                placeholder="Airline Commission"
                value={form.airline_commission}
                onChange={(e) =>
                  setForm({ ...form, airline_commission: e.target.value })
                }
              />

              <input
                className="rounded-2xl border bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                type="number"
                placeholder="Supplier Cost"
                value={form.supplier_cost}
                onChange={(e) =>
                  setForm({ ...form, supplier_cost: e.target.value })
                }
              />

              <input
                className="md:col-span-2 rounded-2xl border bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                type="number"
                placeholder="Taxes"
                value={form.taxes}
                onChange={(e) => setForm({ ...form, taxes: e.target.value })}
              />
            </div>

            <textarea
              className="mt-4 min-h-24 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />

            <button
              disabled={saving}
              className="mt-4 w-full rounded-2xl bg-blue-600 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Ticket Entry"}
            </button>
          </form>

          <div className="rounded-3xl border bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Airline Settlement Register
                </h2>
                <p className="text-sm text-slate-500">
                  BSP, supplier purchase, refund aur profitability tracking.
                </p>
              </div>

              <button
                onClick={exportCSV}
                className="rounded-2xl border bg-slate-950 px-4 py-3 text-sm font-bold text-white"
              >
                Export CSV
              </button>
            </div>

            <div className="mb-5 grid gap-3 md:grid-cols-4">
              <input
                className="rounded-2xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
                placeholder="Search ticket, PNR, passenger..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <select
                className="rounded-2xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
                value={airline}
                onChange={(e) => setAirline(e.target.value)}
              >
                <option value="all">All Airlines</option>
                {airlines.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>

              <select
                className="rounded-2xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">All Settlement</option>
                <option value="pending">Pending</option>
                <option value="settled">Settled</option>
              </select>

              <select
                className="rounded-2xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="all">All Dates</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>

            <div className="overflow-x-auto rounded-2xl border">
              <table className="min-w-[1100px] w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="p-3">Ticket</th>
                    <th className="p-3">Passenger</th>
                    <th className="p-3">Airline</th>
                    <th className="p-3">Sector</th>
                    <th className="p-3 text-right">Sale</th>
                    <th className="p-3 text-right">Cost</th>
                    <th className="p-3 text-right">Profit</th>
                    <th className="p-3">Settlement</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        Loading airline reports...
                      </td>
                    </tr>
                  ) : sales.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500">
                        No airline report found.
                      </td>
                    </tr>
                  ) : (
                    sales.map((s) => {
                      const profit = Number(s.computed_profit || 0);

                      return (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="p-3">
                            <p className="font-black text-slate-900">
                              {s.ticket_no}
                            </p>
                            <p className="text-xs text-slate-500">
                              PNR: {s.pnr || "-"}
                            </p>
                          </td>

                          <td className="p-3">
                            <p className="font-semibold text-slate-800">
                              {s.passenger_name || "-"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {s.travel_date || "-"}
                            </p>
                          </td>

                          <td className="p-3 font-bold text-slate-800">
                            {s.airline || "-"}
                          </td>

                          <td className="p-3 text-slate-700">{s.sector || "-"}</td>

                          <td className="p-3 text-right font-bold">
                            {money(s.selling_price)}
                          </td>

                          <td className="p-3 text-right font-bold">
                            {money(Number(s.supplier_cost || 0) + Number(s.taxes || 0))}
                          </td>

                          <td className="p-3 text-right">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${profitClass(
                                profit
                              )}`}
                            >
                              {money(profit)}
                            </span>
                          </td>

                          <td className="p-3">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase ${badgeClass(
                                s.settlement_status
                              )}`}
                            >
                              {s.settlement_status || "pending"}
                            </span>
                          </td>

                          <td className="p-3">
                            {s.settlement_status === "settled" ? (
                              <span className="text-xs font-bold text-emerald-600">
                                Completed
                              </span>
                            ) : (
                              <button
                                onClick={() => markSettled(s.id)}
                                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white"
                              >
                                Mark Settled
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}