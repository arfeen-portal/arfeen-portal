"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type FormState = {
  hotel_name: string;
  supplier_name: string;
  city: string;
  category: string;
  sharing_rate: string;
  quad_rate: string;
  triple_rate: string;
  double_rate: string;
  currency: string;
  start_date: string;
  end_date: string;
  meal_plan: string;
  distance_from_haram: string;
  notes: string;
};

export default function EditHotelInventoryPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<FormState>({
    hotel_name: "",
    supplier_name: "",
    city: "Makkah",
    category: "",
    sharing_rate: "",
    quad_rate: "",
    triple_rate: "",
    double_rate: "",
    currency: "SAR",
    start_date: "",
    end_date: "",
    meal_plan: "",
    distance_from_haram: "",
    notes: "",
  });

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/umrah/hotels/${id}`, { cache: "no-store" });
        const json = await res.json();

        if (!res.ok) {
          alert(json.error || "Failed to load hotel");
          return;
        }

        const d = json.data;

        setForm({
          hotel_name: d.hotel_name || "",
          supplier_name: d.supplier_name || "",
          city: d.city || "Makkah",
          category: d.category || "",
          sharing_rate: String(d.sharing_rate || ""),
          quad_rate: String(d.quad_rate || ""),
          triple_rate: String(d.triple_rate || ""),
          double_rate: String(d.double_rate || ""),
          currency: d.currency || "SAR",
          start_date: d.start_date || "",
          end_date: d.end_date || "",
          meal_plan: d.meal_plan || "",
          distance_from_haram: d.distance_from_haram || "",
          notes: d.notes || "",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const save = async () => {
    try {
      setSaving(true);

      const res = await fetch(`/api/umrah/hotels/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Update failed");
        return;
      }

      alert("Hotel inventory updated successfully");
      router.push("/umrah/hotels");
    } catch (err: any) {
      alert(err?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <main className="min-h-screen bg-slate-50 p-6 text-sm text-slate-500">Loading...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-3xl border bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Edit Hotel Inventory</h1>
          <p className="mt-1 text-sm text-slate-500">Update rates, validity, supplier and hotel details.</p>
        </div>

        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Hotel Name" value={form.hotel_name} onChange={(v) => update("hotel_name", v)} />
            <Input label="Supplier Name" value={form.supplier_name} onChange={(v) => update("supplier_name", v)} />

            <Select label="City" value={form.city} options={["Makkah", "Madinah"]} onChange={(v) => update("city", v)} />
            <Input label="Category" value={form.category} onChange={(v) => update("category", v)} />

            <Input label="Sharing Rate" type="number" value={form.sharing_rate} onChange={(v) => update("sharing_rate", v)} />
            <Input label="Quad Rate" type="number" value={form.quad_rate} onChange={(v) => update("quad_rate", v)} />
            <Input label="Triple Rate" type="number" value={form.triple_rate} onChange={(v) => update("triple_rate", v)} />
            <Input label="Double Rate" type="number" value={form.double_rate} onChange={(v) => update("double_rate", v)} />

            <Input label="Currency" value={form.currency} onChange={(v) => update("currency", v)} />
            <Input label="Meal Plan" value={form.meal_plan} onChange={(v) => update("meal_plan", v)} />

            <Input label="Start Date" type="date" value={form.start_date} onChange={(v) => update("start_date", v)} />
            <Input label="End Date" type="date" min={form.start_date} value={form.end_date} onChange={(v) => update("end_date", v)} />

            <Input label="Distance From Haram" value={form.distance_from_haram} onChange={(v) => update("distance_from_haram", v)} />
          </div>

          <div className="mt-5">
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              className="mt-1 min-h-32 w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="mt-6 rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Update Inventory"}
          </button>
        </section>
      </div>
    </main>
  );
}

type InputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
};

function Input({ label, value, onChange, type = "text", min }: InputProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
      />
    </label>
  );
}

type SelectProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

function Select({ label, value, options, onChange }: SelectProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
      >
        {options.map((x) => (
          <option key={x} value={x}>{x}</option>
        ))}
      </select>
    </label>
  );
}