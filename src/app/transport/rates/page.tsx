"use client";

import { useEffect, useMemo, useState } from "react";

type Status = "active" | "inactive";
type RateType = "route" | "vehicle" | "seasonal";

type Vehicle = {
  id: string;
  name: string;
  vehicle_class: string;
  plate_number: string | null;
  capacity: number;
  image_url: string | null;
  status: Status;
};

type RouteItem = {
  id: string;
  title: string | null;
  route_name: string | null;
  pickup_location: string | null;
  dropoff_location: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  status: Status;
  notes: string | null;
};

type Rate = {
  id: string;
  title: string;
  rate_type: RateType;
  vehicle_id: string | null;
  route_id: string | null;
  base_price: number;
  season_name: string | null;
  valid_from: string | null;
  valid_to: string | null;
  status: Status;
  notes: string | null;
  vehicle?: Vehicle | null;
  route?: RouteItem | null;
};

type RateForm = {
  id: string;
  rate_type: RateType;
  vehicle_id: string;
  route_id: string;
  base_price: number;
  season_name: string;
  valid_from: string;
  valid_to: string;
  status: Status;
  notes: string;
};

type RouteForm = {
  id: string;
  title: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  status: Status;
  notes: string;
};

const emptyRate: RateForm = {
  id: "",
  rate_type: "route",
  vehicle_id: "",
  route_id: "",
  base_price: 0,
  season_name: "",
  valid_from: "",
  valid_to: "",
  status: "active",
  notes: "",
};

const emptyRoute: RouteForm = {
  id: "",
  title: "",
  pickup_location: "",
  dropoff_location: "",
  pickup_lat: null,
  pickup_lng: null,
  dropoff_lat: null,
  dropoff_lng: null,
  status: "active",
  notes: "",
};

export default function TransportRatesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingRate, setSavingRate] = useState(false);
  const [savingRoute, setSavingRoute] = useState(false);
  const [error, setError] = useState("");

  const [rateModal, setRateModal] = useState(false);
  const [routeModal, setRouteModal] = useState(false);

  const [editingRate, setEditingRate] = useState<RateForm>(emptyRate);
  const [editingRoute, setEditingRoute] = useState<RouteForm>(emptyRoute);

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const [vehicleRes, routeRes, rateRes] = await Promise.all([
        fetch("/api/transport/vehicles", { cache: "no-store" }),
        fetch("/api/transport/routes", { cache: "no-store" }),
        fetch("/api/transport/rates", { cache: "no-store" }),
      ]);

      const vehicleJson = await vehicleRes.json();
      const routeJson = await routeRes.json();
      const rateJson = await rateRes.json();

      if (!vehicleRes.ok) throw new Error(vehicleJson.error || "Failed to load vehicles");
      if (!routeRes.ok) throw new Error(routeJson.error || "Failed to load routes");
      if (!rateRes.ok) throw new Error(rateJson.error || "Failed to load rates");

      setVehicles(vehicleJson.vehicles || []);
      setRoutes(routeJson.routes || []);
      setRates(rateJson.rates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const stats = useMemo(() => {
    const activeRates = rates.filter((rate) => rate.status === "active").length;
    const activeRoutes = routes.filter((route) => route.status === "active").length;
    const avg =
      rates.length > 0
        ? rates.reduce((sum, rate) => sum + Number(rate.base_price || 0), 0) / rates.length
        : 0;

    return {
      totalRates: rates.length,
      activeRates,
      totalRoutes: routes.length,
      activeRoutes,
      avg,
    };
  }, [rates, routes]);

  function routeLabel(route: RouteItem) {
    return route.route_name || route.title || "Route";
  }

  function getVehicleLabelById(vehicleId: string | null) {
    const vehicle = vehicles.find((item) => item.id === vehicleId);
    return vehicle ? `${vehicle.name} - ${vehicle.vehicle_class}` : "Vehicle";
  }

  function getRouteLabelById(routeId: string | null) {
    const route = routes.find((item) => item.id === routeId);
    return route ? routeLabel(route) : "Route";
  }

  function getVehicleName(rate: Rate) {
    if (rate.vehicle) return `${rate.vehicle.name} - ${rate.vehicle.vehicle_class}`;
    return getVehicleLabelById(rate.vehicle_id);
  }

  function getRouteName(rate: Rate) {
    if (rate.route) return routeLabel(rate.route);
    return getRouteLabelById(rate.route_id);
  }

  function openAddRate() {
    setEditingRate(emptyRate);
    setRateModal(true);
  }

  function openEditRate(rate: Rate) {
    setEditingRate({
      id: rate.id,
      rate_type: rate.rate_type || "route",
      vehicle_id: rate.vehicle_id || "",
      route_id: rate.route_id || "",
      base_price: Number(rate.base_price || 0),
      season_name: rate.season_name || "",
      valid_from: rate.valid_from || "",
      valid_to: rate.valid_to || "",
      status: rate.status || "active",
      notes: rate.notes || "",
    });
    setRateModal(true);
  }

  function openAddRoute() {
    setEditingRoute(emptyRoute);
    setRouteModal(true);
  }

  function openEditRoute(route: RouteItem) {
    setEditingRoute({
      id: route.id,
      title: routeLabel(route),
      pickup_location: route.pickup_location || "",
      dropoff_location: route.dropoff_location || "",
      pickup_lat: route.pickup_lat,
      pickup_lng: route.pickup_lng,
      dropoff_lat: route.dropoff_lat,
      dropoff_lng: route.dropoff_lng,
      status: route.status || "active",
      notes: route.notes || "",
    });
    setRouteModal(true);
  }

  function useCurrentPickupLocation() {
    if (!navigator.geolocation) {
      alert("Current location browser mein supported nahi.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setEditingRoute((prev) => ({
          ...prev,
          pickup_lat: lat,
          pickup_lng: lng,
          pickup_location: `Current Location: ${lat}, ${lng}`,
        }));
      },
      () => alert("Location permission allow karein.")
    );
  }

  function useCurrentDropoffLocation() {
    if (!navigator.geolocation) {
      alert("Current location browser mein supported nahi.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setEditingRoute((prev) => ({
          ...prev,
          dropoff_lat: lat,
          dropoff_lng: lng,
          dropoff_location: `Current Location: ${lat}, ${lng}`,
        }));
      },
      () => alert("Location permission allow karein.")
    );
  }

  async function saveRate() {
    if (!editingRate.vehicle_id) return alert("Please select vehicle.");
    if (!editingRate.route_id) return alert("Please select route.");

    const autoTitle = `${getVehicleLabelById(editingRate.vehicle_id)} - ${getRouteLabelById(
      editingRate.route_id
    )}`;

    try {
      setSavingRate(true);

      const method = editingRate.id ? "PATCH" : "POST";

      const res = await fetch("/api/transport/rates", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingRate.id || undefined,
          title: autoTitle,
          rate_type: editingRate.rate_type,
          vehicle_id: editingRate.vehicle_id,
          route_id: editingRate.route_id,
          base_price: Number(editingRate.base_price || 0),
          season_name: editingRate.season_name || null,
          valid_from: editingRate.valid_from || null,
          valid_to: editingRate.valid_to || null,
          status: editingRate.status,
          notes: editingRate.notes || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save rate");

      setRateModal(false);
      setEditingRate(emptyRate);
      await loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Rate save failed");
    } finally {
      setSavingRate(false);
    }
  }

  async function saveRoute() {
    if (!editingRoute.title.trim()) return alert("Route name required.");

    try {
      setSavingRoute(true);

      const method = editingRoute.id ? "PATCH" : "POST";

      const res = await fetch("/api/transport/routes", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingRoute.id || undefined,
          title: editingRoute.title.trim(),
          route_name: editingRoute.title.trim(),
          origin_city: editingRoute.pickup_location || editingRoute.title.trim(),
          destination_city: editingRoute.dropoff_location || editingRoute.title.trim(),
          pickup_location: editingRoute.pickup_location || null,
          dropoff_location: editingRoute.dropoff_location || null,
          pickup_lat: editingRoute.pickup_lat,
          pickup_lng: editingRoute.pickup_lng,
          dropoff_lat: editingRoute.dropoff_lat,
          dropoff_lng: editingRoute.dropoff_lng,
          status: editingRoute.status,
          notes: editingRoute.notes || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save route");

      setRouteModal(false);
      setEditingRoute(emptyRoute);
      await loadAll();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Route save failed");
    } finally {
      setSavingRoute(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] px-6 py-8 text-slate-900">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-orange-600">
                Transport Module
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-950">
                Transport Routes & Rates
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Simple route setup with vehicle-wise pricing.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={openAddRoute}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold hover:bg-slate-50"
              >
                Add Route
              </button>

              <button
                onClick={openAddRate}
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg"
              >
                Add Rate
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-5">
          <Stat title="Total Routes" value={stats.totalRoutes} />
          <Stat title="Active Routes" value={stats.activeRoutes} />
          <Stat title="Total Rates" value={stats.totalRates} />
          <Stat title="Active Rates" value={stats.activeRates} />
          <Stat title="Average Rate" value={`SAR ${stats.avg.toFixed(2)}`} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Feature title="Simple Route" desc="Only route name and pickup/dropoff locations." />
          <Feature title="Auto Rate Title" desc="Rate title is generated from vehicle and route." />
          <Feature title="Commission Removed" desc="Agent commission will be handled in agent dashboard." />
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-black text-slate-950">Routes</h2>
            <p className="text-sm text-slate-500">
              Add simple route names and optional pickup/dropoff locations.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Route</th>
                  <th className="px-5 py-4">Pickup Location</th>
                  <th className="px-5 py-4">Dropoff Location</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm font-semibold text-slate-500">
                      Loading routes...
                    </td>
                  </tr>
                ) : routes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm font-semibold text-slate-500">
                      No routes found. Add your first route.
                    </td>
                  </tr>
                ) : (
                  routes.map((route) => (
                    <tr key={route.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-950">{routeLabel(route)}</p>
                        <p className="text-xs text-slate-500">{route.notes || "No notes"}</p>
                      </td>
                      <td className="px-5 py-4 font-semibold">{route.pickup_location || "-"}</td>
                      <td className="px-5 py-4 font-semibold">{route.dropoff_location || "-"}</td>
                      <td className="px-5 py-4">
                        <Badge status={route.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => openEditRoute(route)}
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

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-black text-slate-950">Rate Rules</h2>
            <p className="text-sm text-slate-500">
              Select vehicle and route. Title is created automatically.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Title</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Vehicle</th>
                  <th className="px-5 py-4">Route</th>
                  <th className="px-5 py-4">Base Price</th>
                  <th className="px-5 py-4">Season</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-sm font-semibold text-slate-500">
                      Loading rates...
                    </td>
                  </tr>
                ) : rates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-sm font-semibold text-slate-500">
                      No rate rules found. Add your first rate.
                    </td>
                  </tr>
                ) : (
                  rates.map((rate) => (
                    <tr key={rate.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-950">{rate.title}</p>
                        <p className="text-xs text-slate-500">{rate.notes || "No notes"}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                          {rate.rate_type}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold">{getVehicleName(rate)}</td>
                      <td className="px-5 py-4 font-semibold">{getRouteName(rate)}</td>
                      <td className="px-5 py-4 font-black">
                        SAR {Number(rate.base_price || 0).toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold">{rate.season_name || "-"}</p>
                        <p className="text-xs text-slate-500">
                          {rate.valid_from || "-"} → {rate.valid_to || "-"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge status={rate.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => openEditRate(rate)}
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

        {rateModal && (
          <Modal title={editingRate.id ? "Edit Rate Rule" : "Add New Rate Rule"} onClose={() => setRateModal(false)}>
            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Rate Type"
                value={editingRate.rate_type}
                onChange={(v) => setEditingRate({ ...editingRate, rate_type: v as RateType })}
                options={[
                  { value: "route", label: "Route" },
                  { value: "vehicle", label: "Vehicle" },
                  { value: "seasonal", label: "Seasonal" },
                ]}
              />

              <Select
                label="Select Vehicle"
                value={editingRate.vehicle_id}
                onChange={(v) => setEditingRate({ ...editingRate, vehicle_id: v })}
                placeholder={vehicles.length === 0 ? "No vehicles found" : "Select vehicle"}
                options={vehicles.map((vehicle) => ({
                  value: vehicle.id,
                  label: `${vehicle.name} - ${vehicle.vehicle_class}`,
                }))}
              />

              <Select
                label="Select Route"
                value={editingRate.route_id}
                onChange={(v) => setEditingRate({ ...editingRate, route_id: v })}
                placeholder={routes.length === 0 ? "No routes found" : "Select route"}
                options={routes.map((route) => ({
                  value: route.id,
                  label: routeLabel(route),
                }))}
              />

              <Input
                label="Base Price SAR"
                type="number"
                value={String(editingRate.base_price)}
                onChange={(v) => setEditingRate({ ...editingRate, base_price: Number(v || 0) })}
              />

              <Input
                label="Season Name"
                value={editingRate.season_name}
                onChange={(v) => setEditingRate({ ...editingRate, season_name: v })}
              />

              <Input
                label="Valid From"
                type="date"
                value={editingRate.valid_from}
                onChange={(v) => setEditingRate({ ...editingRate, valid_from: v })}
              />

              <Input
                label="Valid To"
                type="date"
                value={editingRate.valid_to}
                onChange={(v) => setEditingRate({ ...editingRate, valid_to: v })}
              />

              <Select
                label="Status"
                value={editingRate.status}
                onChange={(v) => setEditingRate({ ...editingRate, status: v as Status })}
                options={[
                  { value: "active", label: "active" },
                  { value: "inactive", label: "inactive" },
                ]}
              />

              <Input
                label="Notes"
                value={editingRate.notes}
                onChange={(v) => setEditingRate({ ...editingRate, notes: v })}
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setRateModal(false)}
                className="rounded-xl border px-5 py-3 text-sm font-bold"
                disabled={savingRate}
              >
                Cancel
              </button>
              <button
                onClick={saveRate}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
                disabled={savingRate}
              >
                {savingRate ? "Saving..." : "Save Rate"}
              </button>
            </div>
          </Modal>
        )}

        {routeModal && (
          <Modal title={editingRoute.id ? "Edit Route" : "Add New Route"} onClose={() => setRouteModal(false)}>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Route Name"
                value={editingRoute.title}
                onChange={(v) => setEditingRoute({ ...editingRoute, title: v })}
              />

              <Select
                label="Status"
                value={editingRoute.status}
                onChange={(v) => setEditingRoute({ ...editingRoute, status: v as Status })}
                options={[
                  { value: "active", label: "active" },
                  { value: "inactive", label: "inactive" },
                ]}
              />

              <Input
                label="Pickup Location"
                value={editingRoute.pickup_location}
                onChange={(v) => setEditingRoute({ ...editingRoute, pickup_location: v })}
              />

              <Input
                label="Dropoff Location"
                value={editingRoute.dropoff_location}
                onChange={(v) => setEditingRoute({ ...editingRoute, dropoff_location: v })}
              />

              <button
                type="button"
                onClick={useCurrentPickupLocation}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold hover:bg-slate-50"
              >
                Use Current Pickup Location
              </button>

              <button
                type="button"
                onClick={useCurrentDropoffLocation}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold hover:bg-slate-50"
              >
                Use Current Dropoff Location
              </button>

              <div className="md:col-span-2">
                <Input
                  label="Notes"
                  value={editingRoute.notes}
                  onChange={(v) => setEditingRoute({ ...editingRoute, notes: v })}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setRouteModal(false)}
                className="rounded-xl border px-5 py-3 text-sm font-bold"
                disabled={savingRoute}
              >
                Cancel
              </button>
              <button
                onClick={saveRoute}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
                disabled={savingRoute}
              >
                {savingRoute ? "Saving..." : "Save Route"}
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

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/95 p-5 shadow-sm">
      <h3 className="font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{desc}</p>
    </div>
  );
}

function Badge({ status }: { status: Status }) {
  return (
    <span
      className={
        status === "active"
          ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700"
          : "rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"
      }
    >
      {status}
    </span>
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
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-950">{title}</h3>
          <button onClick={onClose} className="rounded-full bg-slate-100 px-3 py-1 font-bold">
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
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-950"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}