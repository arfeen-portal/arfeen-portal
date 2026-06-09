"use client";

import { useEffect, useMemo, useState } from "react";

export default function VoucherIntelligencePage() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [error, setError] = useState("");

  const [voucherForm, setVoucherForm] = useState({
    booking_ref: "",
    customer_name: "",
    customer_phone: "",
    voucher_type: "umrah",
    language: "en",
    arrival: "",
    day_two: "",
    departure: "",
  });

  const [recForm, setRecForm] = useState({
    supplier_name: "",
    system_balance: "",
    supplier_statement_balance: "",
  });

  const [periodForm, setPeriodForm] = useState({
    period_type: "day",
    period_start: "",
    period_end: "",
    notes: "",
  });

  async function loadAll() {
    const [v, r, p] = await Promise.all([
      fetch("/api/accounts/voucher-intelligence", { cache: "no-store" }).then((x) => x.json()),
      fetch("/api/accounts/reconciliation-engine", { cache: "no-store" }).then((x) => x.json()),
      fetch("/api/accounts/period-closing", { cache: "no-store" }).then((x) => x.json()),
    ]);

    setVouchers(v.vouchers || []);
    setRecords(r.records || []);
    setPeriods(p.periods || []);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const stats = useMemo(() => {
    return {
      vouchers: vouchers.length,
      whatsapp: vouchers.filter((v) => v.whatsapp_sent).length,
      mismatches: records.filter((r) => r.status === "mismatch").length,
      locked: periods.filter((p) => p.status === "locked").length,
    };
  }, [vouchers, records, periods]);

  async function createVoucher(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/accounts/voucher-intelligence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(voucherForm),
    });

    const json = await res.json();
    if (!res.ok) return setError(json.error || "Voucher failed");

    setVoucherForm({
      booking_ref: "",
      customer_name: "",
      customer_phone: "",
      voucher_type: "umrah",
      language: "en",
      arrival: "",
      day_two: "",
      departure: "",
    });

    loadAll();
  }

  async function voucherAction(id: string, action: string) {
    const res = await fetch("/api/accounts/voucher-intelligence/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, actor: "admin" }),
    });

    const json = await res.json();
    if (!res.ok) setError(json.error || "Action failed");
    else loadAll();
  }

  async function createReconciliation(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/accounts/reconciliation-engine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recForm),
    });

    const json = await res.json();
    if (!res.ok) return setError(json.error || "Reconciliation failed");

    setRecForm({ supplier_name: "", system_balance: "", supplier_statement_balance: "" });
    loadAll();
  }

  async function closePeriod(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/accounts/period-closing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(periodForm),
    });

    const json = await res.json();
    if (!res.ok) return setError(json.error || "Period lock failed");

    setPeriodForm({ period_type: "day", period_start: "", period_end: "", notes: "" });
    loadAll();
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-900 p-6 text-white shadow-xl">
          <p className="text-sm text-indigo-100">Accounts / Voucher Intelligence</p>
          <h1 className="mt-1 text-3xl font-black">Voucher, Closing & Reconciliation Engine</h1>
          <p className="mt-2 max-w-4xl text-sm text-indigo-100">
            Branded PDF voucher workflow, QR verification, WhatsApp delivery, multilingual vouchers,
            revision history, day/month closing, supplier balance matching, mismatch detection,
            auto discrepancy detection and locked accounting periods.
          </p>
        </section>

        {error && <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">{error}</div>}

        <section className="grid gap-4 md:grid-cols-4">
          <Card title="Generated Vouchers" value={stats.vouchers} />
          <Card title="WhatsApp Delivered" value={stats.whatsapp} />
          <Card title="Payment Mismatches" value={stats.mismatches} danger />
          <Card title="Locked Periods" value={stats.locked} />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <form onSubmit={createVoucher} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-bold text-slate-950">Auto Itinerary Voucher</h2>
            <div className="mt-4 space-y-3">
              <input className="input" placeholder="Booking Ref" value={voucherForm.booking_ref} onChange={(e) => setVoucherForm({ ...voucherForm, booking_ref: e.target.value })} />
              <input required className="input" placeholder="Customer Name" value={voucherForm.customer_name} onChange={(e) => setVoucherForm({ ...voucherForm, customer_name: e.target.value })} />
              <input className="input" placeholder="Customer WhatsApp" value={voucherForm.customer_phone} onChange={(e) => setVoucherForm({ ...voucherForm, customer_phone: e.target.value })} />
              <select className="input" value={voucherForm.voucher_type} onChange={(e) => setVoucherForm({ ...voucherForm, voucher_type: e.target.value })}>
                <option value="umrah">Umrah</option>
                <option value="hotel">Hotel</option>
                <option value="transport">Transport</option>
                <option value="flight">Flight</option>
                <option value="package">Package</option>
              </select>
              <select className="input" value={voucherForm.language} onChange={(e) => setVoucherForm({ ...voucherForm, language: e.target.value })}>
                <option value="en">English</option>
                <option value="ur">Urdu</option>
                <option value="ar">Arabic</option>
                <option value="tr">Turkish</option>
                <option value="ms">Malay</option>
              </select>
              <input className="input" placeholder="Arrival Details" value={voucherForm.arrival} onChange={(e) => setVoucherForm({ ...voucherForm, arrival: e.target.value })} />
              <input className="input" placeholder="Day 2 Plan" value={voucherForm.day_two} onChange={(e) => setVoucherForm({ ...voucherForm, day_two: e.target.value })} />
              <input className="input" placeholder="Departure Details" value={voucherForm.departure} onChange={(e) => setVoucherForm({ ...voucherForm, departure: e.target.value })} />
              <button className="btn">Generate Branded Voucher</button>
            </div>
          </form>

          <form onSubmit={createReconciliation} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-bold text-slate-950">Reconciliation Engine</h2>
            <div className="mt-4 space-y-3">
              <input required className="input" placeholder="Supplier Name" value={recForm.supplier_name} onChange={(e) => setRecForm({ ...recForm, supplier_name: e.target.value })} />
              <input required className="input" type="number" placeholder="System Balance" value={recForm.system_balance} onChange={(e) => setRecForm({ ...recForm, system_balance: e.target.value })} />
              <input required className="input" type="number" placeholder="Supplier Statement Balance" value={recForm.supplier_statement_balance} onChange={(e) => setRecForm({ ...recForm, supplier_statement_balance: e.target.value })} />
              <button className="btn">Detect Mismatch</button>
            </div>
          </form>

          <form onSubmit={closePeriod} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-bold text-slate-950">Day / Month Closing</h2>
            <div className="mt-4 space-y-3">
              <select className="input" value={periodForm.period_type} onChange={(e) => setPeriodForm({ ...periodForm, period_type: e.target.value })}>
                <option value="day">Day Closing</option>
                <option value="month">Month Closing</option>
              </select>
              <input required className="input" type="date" value={periodForm.period_start} onChange={(e) => setPeriodForm({ ...periodForm, period_start: e.target.value })} />
              <input required className="input" type="date" value={periodForm.period_end} onChange={(e) => setPeriodForm({ ...periodForm, period_end: e.target.value })} />
              <textarea className="input min-h-24" placeholder="Closing Notes" value={periodForm.notes} onChange={(e) => setPeriodForm({ ...periodForm, notes: e.target.value })} />
              <button className="btn">Lock Accounting Period</button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-bold text-slate-950">Voucher Register</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-3">Voucher</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Language</th>
                  <th className="p-3">QR Token</th>
                  <th className="p-3">Revision</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v) => (
                  <tr key={v.id} className="border-b border-slate-100">
                    <td className="p-3 font-bold">{v.voucher_no}</td>
                    <td className="p-3">{v.customer_name}</td>
                    <td className="p-3 uppercase">{v.language}</td>
                    <td className="p-3 font-mono text-xs">{v.qr_token}</td>
                    <td className="p-3">{v.revision_no}</td>
                    <td className="p-3"><Badge text={v.status} /></td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <SmallBtn text="WhatsApp" onClick={() => voucherAction(v.id, "send_whatsapp")} />
                        <SmallBtn text="Verify QR" onClick={() => voucherAction(v.id, "verify_qr")} />
                        <SmallBtn text="Revise" onClick={() => voucherAction(v.id, "revise")} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <TableBox title="Supplier Balance Matching" rows={records} />
          <PeriodBox periods={periods} />
        </section>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          border-color: rgb(15 23 42);
          box-shadow: 0 0 0 3px rgb(15 23 42 / 0.08);
        }
        .btn {
          width: 100%;
          border-radius: 1rem;
          background: rgb(15 23 42);
          color: white;
          padding: 0.85rem 1rem;
          font-size: 0.875rem;
          font-weight: 800;
        }
      `}</style>
    </main>
  );
}

function Card({ title, value, danger }: any) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`mt-2 text-2xl font-black ${danger ? "text-red-700" : "text-slate-950"}`}>{value}</p>
    </div>
  );
}

function Badge({ text }: any) {
  return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{text}</span>;
}

function SmallBtn({ text, onClick }: any) {
  return <button onClick={onClick} className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100">{text}</button>;
}

function TableBox({ title, rows }: any) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.map((r: any) => (
          <div key={r.id} className="rounded-2xl border border-slate-100 p-4">
            <div className="flex justify-between">
              <b>{r.supplier_name}</b>
              <Badge text={r.status} />
            </div>
            <p className="mt-2 text-sm text-slate-600">
              System: {Number(r.system_balance || 0).toLocaleString()} | Supplier: {Number(r.supplier_statement_balance || 0).toLocaleString()} | Difference: {Number(r.mismatch_amount || 0).toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-500">{r.discrepancy_reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PeriodBox({ periods }: any) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-bold text-slate-950">Locked Accounting Periods</h2>
      <div className="mt-4 space-y-3">
        {periods.map((p: any) => (
          <div key={p.id} className="rounded-2xl border border-slate-100 p-4">
            <div className="flex justify-between">
              <b className="uppercase">{p.period_type} Closing</b>
              <Badge text={p.status} />
            </div>
            <p className="mt-2 text-sm text-slate-600">{p.period_start} to {p.period_end}</p>
            <p className="mt-1 text-xs text-slate-500">{p.notes || "No notes"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}