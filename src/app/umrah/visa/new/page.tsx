"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FormState = {
  supplier_name: string;
  visa_type: string;
  nationality: string;
  cost_rate: string;
  currency: string;
  start_date: string;
  end_date: string;
  status: string;
  notes: string;
};

export default function NewVisaInventoryPage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<FormState>({
    supplier_name: "",
    visa_type: "Umrah Visa",
    nationality: "",
    cost_rate: "",
    currency: "SAR",
    start_date: "",
    end_date: "",
    status: "active",
    notes: "",
  });

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const save = async () => {
    try {
      setSaving(true);

      const response = await fetch("/api/umrah/visa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const json = await response.json();

      if (!response.ok) {
        alert(json.error || "Visa inventory save failed");
        return;
      }

      alert("Visa inventory saved successfully");

      router.push("/umrah/visa");
    } catch (error) {
      console.error(error);
      alert("Visa inventory save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-3xl border bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">
            Add Visa Inventory
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage visa supplier costs, validity dates and visa inventory.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 rounded-3xl border bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Visa Supplier"
                value={form.supplier_name}
                onChange={(value) => update("supplier_name", value)}
              />

              <Input
                label="Visa Type"
                value={form.visa_type}
                onChange={(value) => update("visa_type", value)}
              />

              <Input
                label="Nationality"
                value={form.nationality}
                onChange={(value) => update("nationality", value)}
              />

              <Input
                label="Cost Rate"
                type="number"
                value={form.cost_rate}
                onChange={(value) => update("cost_rate", value)}
              />

              <Input
                label="Currency"
                value={form.currency}
                onChange={(value) => update("currency", value)}
              />

              <Input
                label="Start Date"
                type="date"
                value={form.start_date}
                onChange={(value) => update("start_date", value)}
              />

              <Input
                label="End Date"
                type="date"
                value={form.end_date}
                onChange={(value) => update("end_date", value)}
              />
            </div>

            <div className="mt-5">
              <label className="text-sm font-medium text-slate-700">
                Notes
              </label>

              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                className="mt-1 min-h-32 w-full rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            <button
              onClick={save}
              disabled={saving}
              className="mt-6 rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Visa Inventory"}
            </button>
          </section>

          <aside className="rounded-3xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Visa Intelligence
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Supplier-wise visa rates aur validity tracking yahan maintain
              hogi.
            </p>

            <div className="mt-6 rounded-2xl bg-emerald-50 p-5">
              <p className="text-xs font-medium text-emerald-700">
                Current Visa Type
              </p>

              <p className="mt-1 text-2xl font-bold text-emerald-900">
                {form.visa_type}
              </p>
            </div>

            <div className="mt-4 rounded-2xl bg-blue-50 p-5">
              <p className="text-xs font-medium text-blue-700">
                Cost Rate
              </p>

              <p className="mt-1 text-2xl font-bold text-blue-900">
                {form.cost_rate || 0} {form.currency}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

type InputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
};

function Input({
  label,
  value,
  onChange,
  type = "text",
}: InputProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-2xl border px-4 py-3 outline-none transition focus:ring-2 focus:ring-slate-300"
      />
    </label>
  );
}