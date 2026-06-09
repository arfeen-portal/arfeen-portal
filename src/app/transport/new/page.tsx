"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type FormState = {
  customer_name: string;
  customer_phone: string;
  agent_name: string;
  agent_code: string;
  pickup_city: string;
  dropoff_city: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  passengers: string;
  vehicle_type: string;
  notes: string;
  distance_km: string;
  base_fare: string;
  agent_commission: string;
  total_price: string;
  status: string;
};

const initialForm: FormState = {
  customer_name: "",
  customer_phone: "",
  agent_name: "",
  agent_code: "",
  pickup_city: "",
  dropoff_city: "",
  pickup_location: "",
  dropoff_location: "",
  pickup_time: "",
  passengers: "1",
  vehicle_type: "",
  notes: "",
  distance_km: "",
  base_fare: "",
  agent_commission: "",
  total_price: "",
  status: "pending",
};

function cleanNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const num = Number(trimmed);
  return Number.isNaN(num) ? null : num;
}

export default function NewTransportBookingPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const summary = useMemo(() => {
    return {
      customer: form.customer_name || "—",
      route:
        form.pickup_city && form.dropoff_city
          ? `${form.pickup_city.toUpperCase()} → ${form.dropoff_city.toUpperCase()}`
          : "—",
      vehicle: form.vehicle_type || "—",
      passengers: form.passengers || "1",
      status: form.status || "pending",
      total: form.total_price || "—",
    };
  }, [form]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        agent_name: form.agent_name.trim() || null,
        agent_code: form.agent_code.trim() || null,
        pickup_city: form.pickup_city.trim(),
        dropoff_city: form.dropoff_city.trim(),
        pickup_location: form.pickup_location.trim(),
        dropoff_location: form.dropoff_location.trim(),
        pickup_time: form.pickup_time,
        passengers: form.passengers.trim() ? Number(form.passengers) : 1,
        vehicle_type: form.vehicle_type.trim(),
        notes: form.notes.trim() || null,
        distance_km: cleanNumber(form.distance_km),
        base_fare: cleanNumber(form.base_fare),
        agent_commission: cleanNumber(form.agent_commission),
        total_price: cleanNumber(form.total_price),
        status: form.status.toLowerCase().trim() || "pending",
      };

      const res = await fetch("/api/transport/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to create booking");
      }

      setSuccess("Booking created successfully");

      setTimeout(() => {
        router.push("/transport");
        router.refresh();
      }, 700);
    } catch (err: any) {
      setError(err?.message || "Something went wrong while creating booking");
      console.error("Create booking submit error:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Create Transport Booking
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Create a new airport, ziyarat or intercity transport booking with
              complete customer, route and pricing details.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/transport")}
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-white transition hover:border-slate-500 hover:bg-slate-900"
          >
            Back to list
          </button>
        </div>

        <p className="mb-6 text-sm text-slate-400">
          Fill the required fields and save the booking into the transport module.
        </p>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {success}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-slate-800 bg-[#07112b] p-6 shadow-2xl shadow-black/20"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">Booking Details</h2>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                  Create Mode
                </span>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field
                  label="Customer Name *"
                  name="customer_name"
                  value={form.customer_name}
                  onChange={handleChange}
                  required
                />
                <Field
                  label="Customer Phone *"
                  name="customer_phone"
                  value={form.customer_phone}
                  onChange={handleChange}
                  required
                />

                <Field
                  label="Agent Name"
                  name="agent_name"
                  value={form.agent_name}
                  onChange={handleChange}
                />
                <Field
                  label="Agent Code"
                  name="agent_code"
                  value={form.agent_code}
                  onChange={handleChange}
                />

                <Field
                  label="Pickup City *"
                  name="pickup_city"
                  value={form.pickup_city}
                  onChange={handleChange}
                  required
                />
                <Field
                  label="Dropoff City *"
                  name="dropoff_city"
                  value={form.dropoff_city}
                  onChange={handleChange}
                  required
                />

                <Field
                  label="Pickup Location *"
                  name="pickup_location"
                  value={form.pickup_location}
                  onChange={handleChange}
                  required
                />
                <Field
                  label="Dropoff Location *"
                  name="dropoff_location"
                  value={form.dropoff_location}
                  onChange={handleChange}
                  required
                />

                <Field
                  label="Pickup Time *"
                  name="pickup_time"
                  type="datetime-local"
                  value={form.pickup_time}
                  onChange={handleChange}
                  required
                />
                <Field
                  label="Passengers"
                  name="passengers"
                  type="number"
                  min="1"
                  value={form.passengers}
                  onChange={handleChange}
                />

                <Field
                  label="Vehicle Type *"
                  name="vehicle_type"
                  value={form.vehicle_type}
                  onChange={handleChange}
                  required
                />

                <div>
                  <label className="mb-2 block text-sm text-slate-200">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="h-12 w-full rounded-2xl border border-slate-700 bg-[#020b20] px-4 text-white outline-none transition focus:border-cyan-400"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="assigned">Assigned</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <Field
                  label="Distance (KM)"
                  name="distance_km"
                  type="number"
                  step="0.01"
                  value={form.distance_km}
                  onChange={handleChange}
                />
                <Field
                  label="Base Fare"
                  name="base_fare"
                  type="number"
                  step="0.01"
                  value={form.base_fare}
                  onChange={handleChange}
                />

                <Field
                  label="Agent Commission"
                  name="agent_commission"
                  type="number"
                  step="0.01"
                  value={form.agent_commission}
                  onChange={handleChange}
                />
                <Field
                  label="Total Price"
                  name="total_price"
                  type="number"
                  step="0.01"
                  value={form.total_price}
                  onChange={handleChange}
                />
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm text-slate-200">Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={5}
                  className="w-full rounded-2xl border border-slate-700 bg-[#020b20] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  placeholder="Driver notes, hotel references, arrival details, special instructions..."
                />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Create Booking"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setForm(initialForm);
                    setError("");
                    setSuccess("");
                  }}
                  className="rounded-2xl border border-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:border-slate-500 hover:bg-slate-900"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-[#07112b] p-6">
              <h3 className="mb-5 text-2xl font-semibold">Live booking summary</h3>

              <SummaryRow label="Customer" value={summary.customer} />
              <SummaryRow label="Route" value={summary.route} />
              <SummaryRow label="Vehicle" value={summary.vehicle} />
              <SummaryRow label="Passengers" value={summary.passengers} />
              <SummaryRow label="Status" value={summary.status} />
              <SummaryRow label="Total Price" value={summary.total} />
            </div>

            <div className="rounded-3xl border border-slate-800 bg-[#07112b] p-6">
              <h3 className="mb-4 text-2xl font-semibold">Booking tips</h3>
              <ul className="space-y-3 text-sm text-slate-300">
                <li>• Use exact hotel, airport or landmark names in locations.</li>
                <li>• Keep customer phone accurate for driver coordination.</li>
                <li>• Set fare fields clearly for finance and invoice flow.</li>
                <li>• Use status properly for operations tracking.</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-[#07112b] p-6">
              <h3 className="mb-4 text-2xl font-semibold">Supported booking types</h3>
              <ul className="space-y-3 text-sm text-slate-300">
                <li>• Airport pickup / dropoff</li>
                <li>• Makkah-Madinah intercity transfer</li>
                <li>• Ziyarat circuits</li>
                <li>• Hotel to hotel transfers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  min,
  step,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  type?: string;
  required?: boolean;
  min?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-slate-200">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        min={min}
        step={step}
        className="h-12 w-full rounded-2xl border border-slate-700 bg-[#020b20] px-4 text-white outline-none transition focus:border-cyan-400"
      />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3 flex items-center justify-between rounded-2xl border border-slate-800 bg-[#020b20] px-4 py-3">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}