"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Brain, FileText, Phone, Printer, Utensils } from "lucide-react";

export default function KhurakiDetailPage({ params }: { params: { id: string } }) {
  const [contract, setContract] = useState<any>(null);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);

  async function load() {
    const data = await fetch(`/api/hotels/khuraki/${params.id}`, {
      cache: "no-store",
    }).then((r) => r.json());

    if (data.ok) {
      setContract(data.contract || null);
      setVouchers(data.vouchers || []);
      setIncidents(data.incidents || []);
      setBills(data.supplier_bills || []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/20 to-slate-900 p-6">
          <h1 className="text-3xl font-black">{contract?.title || "Khuraki Detail"}</h1>
          <p className="mt-2 text-slate-300">
            Contract detail, voucher stays, checkout calls, supplier bills aur AI risk center.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card title="Total Vouchers" value={vouchers.length} icon={<FileText />} />
          <Card title="Checked In" value={vouchers.filter((x) => x.status === "checked_in").length} icon={<Utensils />} />
          <Card title="Calls Pending" value={vouchers.filter((x) => x.checkout_call_status === "pending").length} icon={<Phone />} />
          <Card title="Bills" value={bills.length} icon={<Brain />} />
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Voucher Stays</h2>
            <button onClick={() => window.print()} className="flex gap-2 rounded-xl bg-amber-400 px-4 py-2 font-bold text-slate-950">
              <Printer size={16} /> Print
            </button>
          </div>

          <table className="w-full min-w-[900px] text-left">
            <thead className="text-sm text-slate-400">
              <tr>
                <th className="p-3">Voucher</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Hotel</th>
                <th className="p-3">Room</th>
                <th className="p-3">Checkout</th>
                <th className="p-3">Call</th>
                <th className="p-3">Risk</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.map((v) => (
                <tr key={v.id} className="border-t border-white/10">
                  <td className="p-3 font-bold">{v.voucher_no}</td>
                  <td className="p-3">{v.customer_name}</td>
                  <td className="p-3">{v.customer_phone || v.whatsapp_phone || "-"}</td>
                  <td className="p-3">{v.hotel_name}</td>
                  <td className="p-3">{v.room_no || "-"}</td>
                  <td className="p-3">{v.check_out_date}</td>
                  <td className="p-3">{v.checkout_call_status}</td>
                  <td className="p-3">
                    <span className="rounded-full bg-red-400/10 px-3 py-1 text-xs text-red-300">
                      {v.ai_checkout_risk}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="mb-4 text-xl font-bold">Incidents</h2>
          <table className="w-full text-left">
            <thead className="text-sm text-slate-400">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">Type</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((i) => (
                <tr key={i.id} className="border-t border-white/10">
                  <td className="p-3 font-bold">{i.title}</td>
                  <td className="p-3">{i.incident_type}</td>
                  <td className="p-3">{i.severity}</td>
                  <td className="p-3 text-sm text-slate-300">{i.ai_recommendation || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <h2 className="mb-4 text-xl font-bold">Supplier Bills</h2>
          <table className="w-full text-left">
            <thead className="text-sm text-slate-400">
              <tr>
                <th className="p-3">Supplier</th>
                <th className="p-3">Claimed Pax</th>
                <th className="p-3">Verified Pax</th>
                <th className="p-3">Difference</th>
                <th className="p-3">AI Risk</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b.id} className="border-t border-white/10">
                  <td className="p-3">{b.supplier_name}</td>
                  <td className="p-3">{b.claimed_pax}</td>
                  <td className="p-3">{b.verified_pax}</td>
                  <td className="p-3">{b.difference_amount}</td>
                  <td className="p-3">
                    <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs text-amber-300">
                      {b.ai_overbilling_risk}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-5">
          <div className="flex gap-3">
            <AlertTriangle className="text-red-300" />
            <p className="text-slate-200">
              Jis voucher me customer number missing ho, system usko high checkout risk me dalega.
              Umrah operators ke liye ye feature lazmi hai.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, icon }: any) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-3 text-amber-300">{icon}</div>
      <div className="text-2xl font-black">{value}</div>
      <div className="text-sm text-slate-400">{title}</div>
    </div>
  );
}