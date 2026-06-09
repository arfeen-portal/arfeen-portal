"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";

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

const initialState: FormState = {
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

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "assigned", label: "Assigned" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function EditTransportBookingPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const bookingId = params?.id;

  const [form, setForm] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    fetchBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  async function fetchBooking() {
    if (!bookingId) return;

    setInitialLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/transport/bookings/${bookingId}`, {
        cache: "no-store",
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        setError(data?.error || "Failed to load booking");
        setInitialLoading(false);
        return;
      }

      const b = data?.booking;

      setForm({
        customer_name: b?.customer_name || "",
        customer_phone: b?.customer_phone || "",
        agent_name: b?.agent_name || "",
        agent_code: b?.agent_code || "",
        pickup_city: b?.pickup_city || "",
        dropoff_city: b?.dropoff_city || "",
        pickup_location: b?.pickup_location || "",
        dropoff_location: b?.dropoff_location || "",
        pickup_time: b?.pickup_time ? String(b.pickup_time).slice(0, 16) : "",
        passengers: b?.passengers != null ? String(b.passengers) : "1",
        vehicle_type: b?.vehicle_type || "",
        notes: b?.notes || "",
        distance_km: b?.distance_km != null ? String(b.distance_km) : "",
        base_fare: b?.base_fare != null ? String(b.base_fare) : "",
        agent_commission:
          b?.agent_commission != null ? String(b.agent_commission) : "",
        total_price: b?.total_price != null ? String(b.total_price) : "",
        status: b?.status || "pending",
      });
    } catch (err) {
      console.error(err);
      setError("Something went wrong while loading the booking");
    } finally {
      setInitialLoading(false);
    }
  }

  function onChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!bookingId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/transport/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        setError(data?.error || "Failed to update booking");
        setLoading(false);
        return;
      }

      router.push("/transport");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Something went wrong while updating the booking");
      setLoading(false);
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-[100dvh] bg-slate-950 text-slate-50">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-12">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-xl">
            Loading booking...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-12">
        <section className="mb-10 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.3em] text-amber-300 md:text-sm">
            ARFEEN TRAVEL · TRANSPORT UPDATE
          </p>

          <h1 className="text-3xl font-semibold leading-tight md:text-5xl">
            Edit Transport Booking
          </h1>

          <p className="mx-auto mt-4 max-w-3xl text-sm text-slate-300 md:text-xl">
            Update route, pricing, status and customer details for this existing
            transport booking.
          </p>
        </section>

        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Review the booking carefully before updating status or fare details.
          </div>

          <button
            type="button"
            onClick={() => router.push("/transport")}
            className="rounded-full border border-slate-700 px-5 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
          >
            Back to list
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.55fr,0.85fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl md:p-7"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold md:text-xl">Booking Details</h2>
              <span className="rounded-full bg-sky-500/10 px-3 py-1 text-[10px] uppercase tracking-wide text-sky-300 md:text-xs">
                Edit Mode
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Customer Name *"
                name="customer_name"
                value={form.customer_name}
                onChange={onChange}
                required
              />

              <Field
                label="Customer Phone *"
                name="customer_phone"
                value={form.customer_phone}
                onChange={onChange}
                required
              />

              <Field
                label="Agent Name"
                name="agent_name"
                value={form.agent_name}
                onChange={onChange}
              />

              <Field
                label="Agent Code"
                name="agent_code"
                value={form.agent_code}
                onChange={onChange}
              />

              <Field
                label="Pickup City *"
                name="pickup_city"
                value={form.pickup_city}
                onChange={onChange}
                required
              />

              <Field
                label="Dropoff City *"
                name="dropoff_city"
                value={form.dropoff_city}
                onChange={onChange}
                required
              />

              <Field
                label="Pickup Location *"
                name="pickup_location"
                value={form.pickup_location}
                onChange={onChange}
                required
              />

              <Field
                label="Dropoff Location *"
                name="dropoff_location"
                value={form.dropoff_location}
                onChange={onChange}
                required
              />

              <div>
                <label className="mb-2 block text-sm text-slate-300">Pickup Time *</label>
                <input
                  type="datetime-local"
                  name="pickup_time"
                  value={form.pickup_time}
                  onChange={onChange}
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-300"
                />
              </div>

              <Field
                label="Passengers"
                name="passengers"
                value={form.passengers}
                onChange={onChange}
                type="number"
                min={1}
              />

              <Field
                label="Vehicle Type *"
                name="vehicle_type"
                value={form.vehicle_type}
                onChange={onChange}
                required
              />

              <SelectField
                label="Status"
                name="status"
                value={form.status}
                onChange={onChange}
                options={statusOptions}
              />

              <Field
                label="Distance (KM)"
                name="distance_km"
                value={form.distance_km}
                onChange={onChange}
                type="number"
              />

              <Field
                label="Base Fare"
                name="base_fare"
                value={form.base_fare}
                onChange={onChange}
                type="number"
              />

              <Field
                label="Agent Commission"
                name="agent_commission"
                value={form.agent_commission}
                onChange={onChange}
                type="number"
              />

              <Field
                label="Total Price"
                name="total_price"
                value={form.total_price}
                onChange={onChange}
                type="number"
              />
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm text-slate-300">Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={onChange}
                rows={5}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-300"
              />
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push("/transport")}
                className="rounded-full border border-slate-700 px-5 py-2.5 text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-amber-400 px-6 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:opacity-60"
              >
                {loading ? "Updating..." : "Update Booking"}
              </button>
            </div>
          </form>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl md:p-6">
              <h3 className="mb-3 text-lg font-semibold">Live booking summary</h3>
              <div className="space-y-3 text-sm text-slate-300">
                <SummaryRow label="Customer" value={form.customer_name || "—"} />
                <SummaryRow
                  label="Route"
                  value={
                    form.pickup_city || form.dropoff_city
                      ? `${form.pickup_city || "—"} → ${form.dropoff_city || "—"}`
                      : "—"
                  }
                />
                <SummaryRow label="Vehicle" value={form.vehicle_type || "—"} />
                <SummaryRow label="Passengers" value={form.passengers || "—"} />
                <SummaryRow label="Status" value={form.status || "pending"} />
                <SummaryRow label="Total Price" value={form.total_price || "—"} />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl md:p-6">
              <h3 className="mb-3 text-lg font-semibold">Update tips</h3>
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-300">
                <li>Use status carefully for dispatch and completion flow.</li>
                <li>Keep fare changes aligned with finance calculations.</li>
                <li>Verify route details before marking a booking complete.</li>
                <li>Use notes for internal coordination and exceptions.</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl md:p-6">
              <h3 className="mb-3 text-lg font-semibold">Operational note</h3>
              <p className="text-sm text-slate-300">
                This page updates an existing transport booking record and then
                returns to the main transport list after a successful save.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type BaseFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  required?: boolean;
};

function Field({
  label,
  name,
  value,
  onChange,
  required,
  type = "text",
  min,
}: BaseFieldProps & { type?: string; min?: number }) {
  return (
    <div>
      <label className="mb-2 block text-sm text-slate-300">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        min={min}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-300"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
}: BaseFieldProps & {
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-slate-300">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-amber-300"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
      <span className="text-slate-400">{label}</span>
      <span className="max-w-[60%] truncate text-right font-medium text-white">
        {value}
      </span>
    </div>
  );
}