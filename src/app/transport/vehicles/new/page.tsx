"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
export const dynamic = "force-dynamic";
export default function NewVehiclePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [vehicleClass, setVehicleClass] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError(null);

    const { error } = await supabase.from("transport_vehicles").insert({
      name: name.trim(),
      vehicle_class: vehicleClass.trim() || null,
      plate_number: plateNumber.trim() || null,
      capacity: capacity ? Number(capacity) : null,
      notes: notes.trim() || null,
      is_active: isActive,
    });

    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }

    router.push("/transport/vehicles");
  };

  return (
    <div className="max-w-xl space-y-4 p-6">
      <button
        type="button"
        onClick={() => router.push("/transport/vehicles")}
        className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
      >
        ← Back to vehicles
      </button>

      <h1 className="text-xl font-semibold">New Vehicle</h1>

      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border bg-white p-4 shadow-sm"
      >
        <div>
          <label className="block text-xs font-semibold text-gray-600">
            Name *
          </label>
          <input
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Vehicle class
            </label>
            <input
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              placeholder="Hiace, GMC, Sedan..."
              value={vehicleClass}
              onChange={(e) => setVehicleClass(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600">
              Plate number
            </label>
            <input
              className="mt-1 w-full rounded border px-2 py-1 text-sm"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600">
            Capacity (pax)
          </label>
          <input
            type="number"
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            min={1}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600">
            Notes
          </label>
          <textarea
            className="mt-1 w-full rounded border px-2 py-1 text-sm"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="vehicleActive"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label
            htmlFor="vehicleActive"
            className="text-xs font-semibold text-gray-600"
          >
            Active
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => router.push("/transport/vehicles")}
            className="rounded border px-3 py-1.5 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-black px-4 py-1.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save vehicle"}
          </button>
        </div>
      </form>
    </div>
  );
}
