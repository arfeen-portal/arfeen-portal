"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type OptionRow = {
  id: string;
  label: string;
};

type BookingForm = {
  agent_id: string;
  batch_id: string;
  pickup_city: string;
  dropoff_city: string;
  pickup_datetime: string;
  vehicle_id: string;
  pax_count: string;
  selling_price: string;
  supplier_cost: string;
  notes: string;
};

export default function NewTransportBookingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [agents, setAgents] = useState<OptionRow[]>([]);
  const [vehicles, setVehicles] = useState<OptionRow[]>([]);
  const [batches, setBatches] = useState<OptionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorsMsg, setErrorsMsg] = useState<string | null>(null);

  const [form, setForm] = useState<BookingForm>({
    agent_id: "",
    batch_id: "",
    pickup_city: "",
    dropoff_city: "",
    pickup_datetime: "",
    vehicle_id: "",
    pax_count: "1",
    selling_price: "0",
    supplier_cost: "0",
    notes: "",
  });

  useEffect(() => {
    async function loadOptions() {
      if (!supabase) {
        setErrorsMsg("Supabase client is not initialized.");
        return;
      }

      const [agentsRes, vehiclesRes, batchesRes] = await Promise.all([
        supabase.from("agents").select("id, name").order("name", { ascending: true }),
        supabase.from("vehicles").select("id, name").order("name", { ascending: true }),
        supabase.from("batches").select("id, name").order("created_at", { ascending: false }),
      ]);

      if (agentsRes.error) setErrorsMsg(agentsRes.error.message);
      if (vehiclesRes.error) setErrorsMsg(vehiclesRes.error.message);
      if (batchesRes.error) setErrorsMsg(batchesRes.error.message);

      if (agentsRes.data) {
        setAgents(
          agentsRes.data.map((agent: { id: string; name: string | null }) => ({
            id: agent.id,
            label: agent.name ?? "Unnamed Agent",
          }))
        );
      }

      if (vehiclesRes.data) {
        setVehicles(
          vehiclesRes.data.map((vehicle: { id: string; name: string | null }) => ({
            id: vehicle.id,
            label: vehicle.name ?? "Unnamed Vehicle",
          }))
        );
      }

      if (batchesRes.data) {
        setBatches(
          batchesRes.data.map((batch: { id: string; name: string | null }) => ({
            id: batch.id,
            label: batch.name ?? "Unnamed Batch",
          }))
        );
      }
    }

    loadOptions();
  }, [supabase]);

  function updateField(field: keyof BookingForm, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setErrorsMsg("Supabase client is not initialized.");
      return;
    }

    setLoading(true);
    setErrorsMsg(null);

    const { error } = await supabase.from("transport_bookings").insert([
      {
        agent_id: form.agent_id || null,
        batch_id: form.batch_id || null,
        pickup_city: form.pickup_city.trim(),
        dropoff_city: form.dropoff_city.trim(),
        pickup_time: form.pickup_datetime
          ? new Date(form.pickup_datetime).toISOString()
          : null,
        vehicle_id: form.vehicle_id || null,
        passengers: Number(form.pax_count || 1),
        total_price: Number(form.selling_price || 0),
        base_fare: Number(form.supplier_cost || 0),
        notes: form.notes.trim() || null,
        status: "pending",
      },
    ]);

    setLoading(false);

    if (error) {
      console.error(error);
      setErrorsMsg(error.message);
      return;
    }

    router.push("/transport/bookings");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            New Transport Booking
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create a new transport booking with agent, batch, route, vehicle and pricing details.
          </p>
        </div>

        {errorsMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorsMsg}
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border bg-white p-6 shadow-sm"
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Field label="Agent">
              <select
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={form.agent_id}
                onChange={(event) => updateField("agent_id", event.target.value)}
              >
                <option value="">Select agent</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Batch">
              <select
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={form.batch_id}
                onChange={(event) => updateField("batch_id", event.target.value)}
              >
                <option value="">Optional</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Pickup City">
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={form.pickup_city}
                onChange={(event) => updateField("pickup_city", event.target.value)}
                required
              />
            </Field>

            <Field label="Dropoff City">
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={form.dropoff_city}
                onChange={(event) => updateField("dropoff_city", event.target.value)}
                required
              />
            </Field>

            <Field label="Pickup Date & Time">
              <input
                type="datetime-local"
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={form.pickup_datetime}
                onChange={(event) =>
                  updateField("pickup_datetime", event.target.value)
                }
                required
              />
            </Field>

            <Field label="Vehicle">
              <select
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={form.vehicle_id}
                onChange={(event) => updateField("vehicle_id", event.target.value)}
              >
                <option value="">Select vehicle</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="PAX">
              <input
                type="number"
                min="1"
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={form.pax_count}
                onChange={(event) => updateField("pax_count", event.target.value)}
              />
            </Field>

            <Field label="Selling Price">
              <input
                type="number"
                min="0"
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={form.selling_price}
                onChange={(event) =>
                  updateField("selling_price", event.target.value)
                }
              />
            </Field>

            <Field label="Supplier Cost">
              <input
                type="number"
                min="0"
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={form.supplier_cost}
                onChange={(event) =>
                  updateField("supplier_cost", event.target.value)
                }
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Notes">
                <textarea
                  className="min-h-28 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-500"
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                />
              </Field>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/transport/bookings")}
              className="rounded-xl border px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}