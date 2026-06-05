"use client";

import { useEffect, useMemo, useState } from "react";

type VehicleStatus = "active" | "inactive";

type Vehicle = {
  id: string;
  name: string;
  vehicle_class: string;
  plate_number: string | null;
  capacity: number;
  image_url: string | null;
  status: VehicleStatus;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
};

type VehicleForm = {
  id: string;
  name: string;
  vehicle_class: string;
  plate_number: string;
  capacity: number;
  image_url: string;
  status: VehicleStatus;
  notes: string;
};

const emptyVehicle: VehicleForm = {
  id: "",
  name: "",
  vehicle_class: "",
  plate_number: "",
  capacity: 0,
  image_url: "",
  status: "active",
  notes: "",
};

export default function TransportVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleForm>(emptyVehicle);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadVehicles() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/transport/vehicles", {
        method: "GET",
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to load vehicles");
      }

      setVehicles(json.vehicles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVehicles();
  }, []);

  const stats = useMemo(() => {
    const active = vehicles.filter((v) => v.status === "active").length;
    const capacity = vehicles.reduce((sum, v) => sum + Number(v.capacity || 0), 0);

    return {
      total: vehicles.length,
      active,
      capacity,
    };
  }, [vehicles]);

  function openAddModal() {
    setEditing(emptyVehicle);
    setOpen(true);
  }

  function openEditModal(vehicle: Vehicle) {
    setEditing({
      id: vehicle.id,
      name: vehicle.name || "",
      vehicle_class: vehicle.vehicle_class || "",
      plate_number: vehicle.plate_number || "",
      capacity: Number(vehicle.capacity || 0),
      image_url: vehicle.image_url || "",
      status: vehicle.status || "active",
      notes: vehicle.notes || "",
    });
    setOpen(true);
  }

  async function saveVehicle() {
    if (!editing.name.trim() || !editing.vehicle_class.trim()) {
      alert("Vehicle name aur vehicle class required hai.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const method = editing.id ? "PATCH" : "POST";

      const res = await fetch("/api/transport/vehicles", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id || undefined,
          name: editing.name.trim(),
          vehicle_class: editing.vehicle_class.trim(),
          plate_number: editing.plate_number.trim() || null,
          capacity: Number(editing.capacity || 0),
          image_url: editing.image_url || null,
          status: editing.status,
          notes: editing.notes.trim() || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to save vehicle");
      }

      setOpen(false);
      setEditing(emptyVehicle);
      await loadVehicles();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Vehicle save failed");
    } finally {
      setSaving(false);
    }
  }

  function handleImageUpload(file?: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Sirf image file upload karein.");
      return;
    }

    const maxSizeMb = 4;
    if (file.size > maxSizeMb * 1024 * 1024) {
      alert(`Image ${maxSizeMb}MB se choti honi chahiye.`);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setEditing((prev) => ({
          ...prev,
          image_url: result,
        }));
      }
    };

    reader.readAsDataURL(file);
  }

  return (
    <main className="min-h-screen bg-[#020617] px-6 py-8 text-slate-900">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-600">
                Transport Module
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-950">Vehicles</h1>
              <p className="mt-1 text-sm text-slate-500">
                Official Supabase-connected fleet inventory. Added vehicles will remain after refresh.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg hover:bg-slate-800"
            >
              Add New Vehicle
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Stat title="Total Vehicles" value={stats.total} />
          <Stat title="Active Vehicles" value={stats.active} />
          <Stat title="Total Capacity" value={stats.capacity} />
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-black text-slate-950">Fleet List</h2>
            <p className="text-sm text-slate-500">
              Vehicles are loaded directly from Supabase table transport_vehicles.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Vehicle</th>
                  <th className="px-5 py-4">Class</th>
                  <th className="px-5 py-4">Plate</th>
                  <th className="px-5 py-4">Capacity</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm font-semibold text-slate-500">
                      Loading vehicles...
                    </td>
                  </tr>
                ) : vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm font-semibold text-slate-500">
                      No vehicles found. Add your first vehicle.
                    </td>
                  </tr>
                ) : (
                  vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-20 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
                            {vehicle.image_url ? (
                              <img
                                src={vehicle.image_url}
                                alt={vehicle.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">
                                IMG
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="font-bold text-slate-950">{vehicle.name}</p>
                            <p className="text-xs text-slate-500">{vehicle.notes || "No notes"}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-semibold">{vehicle.vehicle_class}</td>
                      <td className="px-5 py-4">{vehicle.plate_number || "-"}</td>
                      <td className="px-5 py-4 font-bold">{vehicle.capacity}</td>
                      <td className="px-5 py-4">
                        <span
                          className={
                            vehicle.status === "active"
                              ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"
                              : "rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700"
                          }
                        >
                          {vehicle.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEditModal(vehicle)}
                          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold hover:bg-slate-950 hover:text-white"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {open && (
          <Modal
            title={editing.id ? "Edit Vehicle" : "Add New Vehicle"}
            onClose={() => {
              setOpen(false);
              setEditing(emptyVehicle);
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Vehicle Name"
                value={editing.name}
                onChange={(value) => setEditing({ ...editing, name: value })}
                placeholder="GMC VIP"
              />

              <Input
                label="Vehicle Class"
                value={editing.vehicle_class}
                onChange={(value) => setEditing({ ...editing, vehicle_class: value })}
                placeholder="GMC / Hiace / Coaster"
              />

              <Input
                label="Plate Number"
                value={editing.plate_number}
                onChange={(value) => setEditing({ ...editing, plate_number: value })}
                placeholder="VIP-001"
              />

              <Input
                label="Capacity"
                type="number"
                value={String(editing.capacity)}
                onChange={(value) => setEditing({ ...editing, capacity: Number(value || 0) })}
                placeholder="6"
              />

              <ImageUploadBox
                imageUrl={editing.image_url}
                onUpload={handleImageUpload}
                onRemove={() => setEditing((prev) => ({ ...prev, image_url: "" }))}
              />

              <Select
                label="Status"
                value={editing.status}
                onChange={(value) => setEditing({ ...editing, status: value as VehicleStatus })}
                options={["active", "inactive"]}
              />

              <div className="md:col-span-2">
                <Input
                  label="Notes"
                  value={editing.notes}
                  onChange={(value) => setEditing({ ...editing, notes: value })}
                  placeholder="Premium VIP family vehicle"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setEditing(emptyVehicle);
                }}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold hover:bg-slate-50"
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveVehicle}
                disabled={saving}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Vehicle"}
              </button>
            </div>
          </Modal>
        )}
      </section>
    </main>
  );
}

function Stat({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold text-slate-500">{title}</p>
      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-950">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-700 hover:bg-slate-200"
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-950"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-950"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ImageUploadBox({
  imageUrl,
  onUpload,
  onRemove,
}: {
  imageUrl: string;
  onUpload: (file?: File) => void;
  onRemove: () => void;
}) {
  return (
    <div>
      <span className="text-xs font-bold uppercase text-slate-500">Vehicle Picture</span>

      <label className="mt-2 flex min-h-[150px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center hover:bg-slate-100">
        {imageUrl ? (
          <img src={imageUrl} alt="Vehicle preview" className="h-36 w-full rounded-xl object-cover" />
        ) : (
          <>
            <span className="text-sm font-bold text-slate-700">Upload Vehicle Image</span>
            <span className="mt-1 text-xs text-slate-500">
              JPG, PNG, WEBP supported. Image size system adjust karega.
            </span>
          </>
        )}

        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => onUpload(event.target.files?.[0])}
        />
      </label>

      {imageUrl && (
        <button
          type="button"
          onClick={onRemove}
          className="mt-2 text-xs font-bold text-red-600 hover:text-red-700"
        >
          Remove image
        </button>
      )}
    </div>
  );
}