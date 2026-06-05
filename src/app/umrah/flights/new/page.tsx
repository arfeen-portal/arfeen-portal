"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewUmrahFlightPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    item_type: "flight_seat",
    title: "",
    supplier_name: "",
    city: "",
    category: "",
    total_qty: 0,
    booked_qty: 0,
    cost_price: 0,
    sale_price: 0,
    currency: "SAR",
    status: "active",
    meta: {
      airline: "",
      pnr: "",
      departure: "",
      return_flight: "",
      deadline: "",
    },
  });

  async function submit() {
    setSaving(true);

    const res = await fetch("/api/umrah/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (res.ok) router.push("/umrah/flights");
    else alert("Flight inventory save failed");
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold">Add Flight Allocation</h1>
        <p className="mb-6 text-slate-500">Add PNR, group fare seats and flight deadlines.</p>

        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Flight Title / Route" value={form.title} onChange={(v: string) => setForm({ ...form, title: v })} />
          <Input label="Airline" value={form.meta.airline} onChange={(v: string) => setForm({ ...form, meta: { ...form.meta, airline: v } })} />
          <Input label="PNR" value={form.meta.pnr} onChange={(v: string) => setForm({ ...form, meta: { ...form.meta, pnr: v } })} />
          <Input label="Supplier" value={form.supplier_name} onChange={(v: string) => setForm({ ...form, supplier_name: v })} />
          <Input label="Origin / City" value={form.city} onChange={(v: string) => setForm({ ...form, city: v })} />
          <Input label="Category" value={form.category} onChange={(v: string) => setForm({ ...form, category: v })} />
          <Input label="Total Seats" type="number" value={form.total_qty} onChange={(v: string) => setForm({ ...form, total_qty: Number(v) })} />
          <Input label="Cost Price" type="number" value={form.cost_price} onChange={(v: string) => setForm({ ...form, cost_price: Number(v) })} />
          <Input label="Sale Price" type="number" value={form.sale_price} onChange={(v: string) => setForm({ ...form, sale_price: Number(v) })} />
          <Input label="Deadline" type="date" value={form.meta.deadline} onChange={(v: string) => setForm({ ...form, meta: { ...form.meta, deadline: v } })} />
        </div>

        <button
          onClick={submit}
          disabled={saving}
          className="mt-6 rounded-xl bg-black px-6 py-3 text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Flight"}
        </button>
      </div>
    </main>
  );
}

function Input({ label, value, onChange, type = "text" }: any) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        type={type}
        className="w-full rounded-xl border px-4 py-3"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}