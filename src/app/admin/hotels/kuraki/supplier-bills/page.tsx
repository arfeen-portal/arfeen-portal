"use client";

import { useEffect, useState } from "react";
import { FileWarning, Plus, Printer } from "lucide-react";

export default function SupplierBillsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [form, setForm] = useState({
    contract_id: "",
    supplier_name: "",
    bill_no: "",
    from_date: "",
    to_date: "",
    claimed_pax: "",
    verified_pax: "",
    rate_per_person: "",
    notes: "",
  });

  async function load() {
    const data = await fetch("/api/hotels/khuraki/supplier-bills", {
      cache: "no-store",
    }).then((r) => r.json());

    if (data.ok) setRows(data.bills || []);
  }

  async function loadContracts() {
    const data = await fetch("/api/hotels/khuraki", {
      cache: "no-store",
    }).then((r) => r.json());

    if (data.ok) setContracts(data.contracts || []);
  }

  async function save() {
    const data = await fetch("/api/hotels/khuraki/supplier-bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).then((r) => r.json());

    if (data.ok) {
      setForm({
        contract_id: "",
        supplier_name: "",
        bill_no: "",
        from_date: "",
        to_date: "",
        claimed_pax: "",
        verified_pax: "",
        rate_per_person: "",
        notes: "",
      });
      load();
    } else {
      alert(data.error || "Error");
    }
  }

  useEffect(() => {
    load();
    loadContracts();
  }, []);

  function riskClass(score: number) {
    if (score > 65) return "bg-red-500/20 text-red-200 ring-1 ring-red-400/40";
    if (score > 35) return "bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/40";
    return "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-400/40";
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/20 to-slate-900 p-6">
          <h1 className="text-3xl font-black">Supplier Billing Control</h1>
          <p className="mt-2 text-slate-300">
            Claimed pax vs verified pax se overbilling risk auto calculate hoga.
          </p>
        </div>

        <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-5 md:grid-cols-4">
          {contracts.length ? (
            <select
              value={form.contract_id}
              onChange={(e) => setForm({ ...form, contract_id: e.target.value })}
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
            >
              <option value="">Select Contract</option>
              {contracts.map((contract) => (
                <option key={contract.id} value={contract.id}>
                  {contract.title} · {contract.city}
                </option>
              ))}
            </select>
          ) : (
            <input
              placeholder="Contract ID"
              value={form.contract_id}
              onChange={(e) => setForm({ ...form, contract_id: e.target.value })}
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
            />
          )}
          {[
            ["supplier_name", "Supplier Name"],
            ["bill_no", "Bill No"],
            ["from_date", "From Date"],
            ["to_date", "To Date"],
            ["claimed_pax", "Claimed Pax"],
            ["verified_pax", "Verified Pax"],
            ["rate_per_person", "Rate Per Person"],
          ].map(([k, p]) => (
            <input
              key={k}
              type={k.includes("date") ? "date" : k.includes("pax") || k.includes("rate") ? "number" : "text"}
              placeholder={p}
              value={(form as any)[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
            />
          ))}

          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 md:col-span-4"
          />

          <button onClick={save} className="flex items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 font-bold text-slate-950 md:col-span-2">
            <Plus size={16} /> Save Bill
          </button>
          <button onClick={() => window.print()} className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-3 font-bold md:col-span-2">
            <Printer size={16} /> Print
          </button>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-white/[0.06] text-sm text-slate-300">
              <tr>
                <th className="p-4">Supplier</th>
                <th className="p-4">Bill</th>
                <th className="p-4">Claimed</th>
                <th className="p-4">Verified</th>
                <th className="p-4">Difference</th>
                <th className="p-4">AI Risk</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-t border-white/10">
                  <td className="p-4 font-bold">{b.supplier_name}</td>
                  <td className="p-4">{b.bill_no || "-"}</td>
                  <td className="p-4">{b.claimed_pax}</td>
                  <td className="p-4">{b.verified_pax}</td>
                  <td className="p-4">{b.difference_amount}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${riskClass(Number(b.ai_overbilling_risk || 0))}`}>
                      <FileWarning size={13} className="inline" /> {b.ai_overbilling_risk}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}