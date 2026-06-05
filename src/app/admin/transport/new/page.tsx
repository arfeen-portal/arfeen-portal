"use client";

import { FormEvent, useMemo, useState } from "react";

type BookingForm = {
  agent_id: string;
  customer_name: string;
  customer_phone: string;
  pickup_city: string;
  dropoff_city: string;
  pickup_location: string;
  dropoff_location: string;
  date: string;
  time: string;
  vehicle_type: string;
  passengers: number;
  price: number;
  notes: string;
};

const initialForm: BookingForm = {
  agent_id: "",
  customer_name: "",
  customer_phone: "",
  pickup_city: "",
  dropoff_city: "",
  pickup_location: "",
  dropoff_location: "",
  date: "",
  time: "",
  vehicle_type: "",
  passengers: 1,
  price: 0,
  notes: "",
};

const vehicleTypes = ["Sedan", "SUV", "Hiace", "Coaster", "Bus", "Luxury Van"];

export default function NewTransportBookingPage() {
  const [form, setForm] = useState<BookingForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pickupDateTime = useMemo(() => {
    if (!form.date || !form.time) return "";
    return `${form.date}T${form.time}:00`;
  }, [form.date, form.time]);

  function updateField<K extends keyof BookingForm>(key: K, value: BookingForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate() {
    if (!form.customer_name.trim()) return "Customer name is required.";
    if (!form.customer_phone.trim()) return "Customer phone is required.";
    if (!form.pickup_city.trim()) return "Pickup city is required.";
    if (!form.dropoff_city.trim()) return "Dropoff city is required.";
    if (!form.date) return "Pickup date is required.";
    if (!form.time) return "Pickup time is required.";
    if (!form.vehicle_type) return "Vehicle type is required.";
    if (form.passengers < 1) return "Passengers must be at least 1.";
    if (form.price < 0) return "Price cannot be negative.";
    return "";
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        agent_id: form.agent_id || null,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        pickup_city: form.pickup_city,
        dropoff_city: form.dropoff_city,
        pickup_location: form.pickup_location,
        dropoff_location: form.dropoff_location,
        pickup_time: pickupDateTime,
        vehicle_type: form.vehicle_type,
        passengers: form.passengers,
        total_price: form.price,
        notes: form.notes,
      };

      const res = await fetch("/api/transport/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok || result?.error) {
        throw new Error(result?.error || "Booking could not be created.");
      }

      alert("Transport booking created successfully.");
      setForm(initialForm);
    } catch (err: any) {
      setError(err?.message || "Unexpected error while creating booking.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white shadow">
          <p className="text-sm text-slate-300">Admin Transport</p>
          <h1 className="mt-2 text-2xl font-bold md:text-3xl">
            New Transport Booking
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-200">
            Create a professional transport booking with customer details, route,
            vehicle, passenger count, fare, and pickup schedule.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7"
        >
          {error ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Customer Name" required>
              <input
                value={form.customer_name}
                onChange={(e) => updateField("customer_name", e.target.value)}
                className="input"
                placeholder="Enter customer name"
              />
            </Field>

            <Field label="Customer Phone" required>
              <input
                value={form.customer_phone}
                onChange={(e) => updateField("customer_phone", e.target.value)}
                className="input"
                placeholder="+966 / +92 phone number"
              />
            </Field>

            <Field label="Agent ID">
              <input
                value={form.agent_id}
                onChange={(e) => updateField("agent_id", e.target.value)}
                className="input"
                placeholder="Optional agent ID"
              />
            </Field>

            <Field label="Vehicle Type" required>
              <select
                value={form.vehicle_type}
                onChange={(e) => updateField("vehicle_type", e.target.value)}
                className="input"
              >
                <option value="">Select vehicle</option>
                {vehicleTypes.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Pickup City" required>
              <input
                value={form.pickup_city}
                onChange={(e) => updateField("pickup_city", e.target.value)}
                className="input"
                placeholder="Makkah, Madinah, Jeddah..."
              />
            </Field>

            <Field label="Dropoff City" required>
              <input
                value={form.dropoff_city}
                onChange={(e) => updateField("dropoff_city", e.target.value)}
                className="input"
                placeholder="Makkah, Madinah, Jeddah..."
              />
            </Field>

            <Field label="Pickup Location">
              <input
                value={form.pickup_location}
                onChange={(e) => updateField("pickup_location", e.target.value)}
                className="input"
                placeholder="Hotel / Airport / Address"
              />
            </Field>

            <Field label="Dropoff Location">
              <input
                value={form.dropoff_location}
                onChange={(e) => updateField("dropoff_location", e.target.value)}
                className="input"
                placeholder="Hotel / Airport / Address"
              />
            </Field>

            <Field label="Pickup Date" required>
              <input
                type="date"
                value={form.date}
                onChange={(e) => updateField("date", e.target.value)}
                className="input"
              />
            </Field>

            <Field label="Pickup Time" required>
              <input
                type="time"
                value={form.time}
                onChange={(e) => updateField("time", e.target.value)}
                className="input"
              />
            </Field>

            <Field label="Passengers" required>
              <input
                type="number"
                min={1}
                value={form.passengers}
                onChange={(e) =>
                  updateField("passengers", Number(e.target.value || 1))
                }
                className="input"
              />
            </Field>

            <Field label="Total Price">
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => updateField("price", Number(e.target.value || 0))}
                className="input"
                placeholder="0"
              />
            </Field>
          </div>

          <div className="mt-5">
            <Field label="Notes">
              <textarea
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                className="input min-h-28 resize-none"
                placeholder="Driver note, passenger request, luggage details..."
              />
            </Field>
          </div>

          <div className="mt-7 flex flex-col gap-3 border-t border-slate-100 pt-5 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-slate-500">
              Pickup datetime:{" "}
              <span className="font-semibold text-slate-800">
                {pickupDateTime || "Not selected"}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Booking"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgb(226 232 240);
          background: white;
          padding: 0.75rem 0.9rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          border-color: rgb(15 23 42);
          box-shadow: 0 0 0 3px rgb(15 23 42 / 0.08);
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}