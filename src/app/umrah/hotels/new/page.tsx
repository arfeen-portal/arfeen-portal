"use client";

import { useState } from "react";

type RatePeriod = {
  start_date: string;
  end_date: string;
  sharing_rate: string;
  quad_rate: string;
  triple_rate: string;
  double_rate: string;
};

type FormState = {
  hotel_name: string;
  supplier_name: string;
  city: string;
  category: string;
  currency: string;
  meal_plan: string;
  distance_from_haram: string;
  notes: string;
  periods: RatePeriod[];
};

const emptyPeriod: RatePeriod = {
  start_date: "",
  end_date: "",
  sharing_rate: "",
  quad_rate: "",
  triple_rate: "",
  double_rate: "",
};

export default function NewHotelInventoryPage() {
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<FormState>({
    hotel_name: "",
    supplier_name: "",
    city: "Makkah",
    category: "",
    currency: "SAR",
    meal_plan: "",
    distance_from_haram: "",
    notes: "",
    periods: [{ ...emptyPeriod }],
  });

  const update = (key: keyof Omit<FormState, "periods">, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updatePeriod = (index: number, key: keyof RatePeriod, value: string) => {
    setForm((prev) => {
      const periods = [...prev.periods];
      periods[index] = { ...periods[index], [key]: value };

      if (key === "start_date" && periods[index].end_date && periods[index].end_date < value) {
        periods[index].end_date = value;
      }

      return { ...prev, periods };
    });
  };

  const addPeriod = () => {
    setForm((prev) => ({
      ...prev,
      periods: [...prev.periods, { ...emptyPeriod }],
    }));
  };

  const removePeriod = (index: number) => {
    setForm((prev) => ({
      ...prev,
      periods: prev.periods.filter((_, i) => i !== index),
    }));
  };

  const save = async () => {
    try {
      setSaving(true);

      for (const period of form.periods) {
        const payload = {
          hotel_name: form.hotel_name,
          supplier_name: form.supplier_name,
          city: form.city,
          category: form.category,
          currency: form.currency,
          meal_plan: form.meal_plan,
          distance_from_haram: form.distance_from_haram,
          notes: form.notes,
          ...period,
        };

        const res = await fetch("/api/umrah/hotels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const json = await res.json();

        if (!res.ok) {
          alert(json.error || "Save failed");
          return;
        }
      }

      alert("Hotel rate periods saved successfully");

      setForm({
        hotel_name: "",
        supplier_name: "",
        city: "Makkah",
        category: "",
        currency: "SAR",
        meal_plan: "",
        distance_from_haram: "",
        notes: "",
        periods: [{ ...emptyPeriod }],
      });
    } catch (err: any) {
      alert(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl border bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold">Add Hotel Inventory</h1>
          <p className="mt-2 text-sm text-slate-500">
            Add multiple date-wise rates for one hotel and supplier.
          </p>
        </div>

        <section className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Hotel Name" value={form.hotel_name} onChange={(v) => update("hotel_name", v)} />
            <Input label="Supplier Name" value={form.supplier_name} onChange={(v) => update("supplier_name", v)} />
            <Select label="City" value={form.city} options={["Makkah", "Madinah"]} onChange={(v) => update("city", v)} />
            <Input label="Category" value={form.category} onChange={(v) => update("category", v)} />
            <Input label="Currency" value={form.currency} onChange={(v) => update("currency", v)} />
            <Input label="Meal Plan" value={form.meal_plan} onChange={(v) => update("meal_plan", v)} />
            <Input label="Distance From Haram" value={form.distance_from_haram} onChange={(v) => update("distance_from_haram", v)} />
          </div>

          <div className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Date-wise Rate Periods</h2>
              <button
                type="button"
                onClick={addPeriod}
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                + Add More
              </button>
            </div>

            <div className="space-y-4">
              {form.periods.map((period, index) => (
                <div key={index} className="rounded-3xl border bg-slate-50 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-semibold text-slate-800">Rate Period #{index + 1}</p>

                    {form.periods.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePeriod(index)}
                        className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <Input
                      label="Start Date"
                      type="date"
                      value={period.start_date}
                      onChange={(v) => updatePeriod(index, "start_date", v)}
                    />

                    <Input
                      label="End Date"
                      type="date"
                      min={period.start_date}
                      value={period.end_date}
                      onChange={(v) => updatePeriod(index, "end_date", v)}
                    />

                    <Input
                      label="Sharing Rate"
                      type="number"
                      value={period.sharing_rate}
                      onChange={(v) => updatePeriod(index, "sharing_rate", v)}
                    />

                    <Input
                      label="Quad Rate"
                      type="number"
                      value={period.quad_rate}
                      onChange={(v) => updatePeriod(index, "quad_rate", v)}
                    />

                    <Input
                      label="Triple Rate"
                      type="number"
                      value={period.triple_rate}
                      onChange={(v) => updatePeriod(index, "triple_rate", v)}
                    />

                    <Input
                      label="Double Rate"
                      type="number"
                      value={period.double_rate}
                      onChange={(v) => updatePeriod(index, "double_rate", v)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              className="mt-1 min-h-28 w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="mt-6 rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save All Rate Periods"}
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