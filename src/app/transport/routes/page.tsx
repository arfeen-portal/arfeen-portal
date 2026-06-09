"use client";

import { useMemo, useState } from "react";

type RouteItem = {
  id: string;
  route_name: string;
  from_city: string;
  from_type: string;
  from_location: string;
  to_city: string;
  to_type: string;
  to_location: string;
  base_price: number;
  status: "active" | "inactive";
  notes: string;
};

const emptyRoute: RouteItem = {
  id: "",
  route_name: "",
  from_city: "",
  from_type: "",
  from_location: "",
  to_city: "",
  to_type: "",
  to_location: "",
  base_price: 0,
  status: "active",
  notes: "",
};

const starterRoutes: RouteItem[] = [
  {
    id: "1",
    route_name: "JED Airport → Makkah Hotel",
    from_city: "Jeddah",
    from_type: "airport",
    from_location: "JED Airport",
    to_city: "Makkah",
    to_type: "hotel",
    to_location: "Any Makkah Hotel",
    base_price: 250,
    status: "active",
    notes: "",
  },
  {
    id: "2",
    route_name: "Makkah Hotel → Madinah Hotel",
    from_city: "Makkah",
    from_type: "hotel",
    from_location: "Any Makkah Hotel",
    to_city: "Madinah",
    to_type: "hotel",
    to_location: "Any Madinah Hotel",
    base_price: 450,
    status: "active",
    notes: "",
  },
];

export default function TransportRoutesPage() {
  const [routes, setRoutes] = useState<RouteItem[]>(starterRoutes);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RouteItem>(emptyRoute);

  const stats = useMemo(() => {
    const active = routes.filter((r) => r.status === "active").length;
    const avg = routes.length ? routes.reduce((s, r) => s + Number(r.base_price || 0), 0) / routes.length : 0;
    return { total: routes.length, active, avg };
  }, [routes]);

  function saveRoute() {
    if (!editing.route_name || !editing.from_city || !editing.to_city) {
      return alert("Route name, from city aur to city required hain.");
    }

    if (editing.id) {
      setRoutes((prev) => prev.map((r) => (r.id === editing.id ? editing : r)));
    } else {
      setRoutes((prev) => [{ ...editing, id: crypto.randomUUID(), base_price: Number(editing.base_price || 0) }, ...prev]);
    }

    setOpen(false);
    setEditing(emptyRoute);
  }

  return (
    <main className="min-h-screen bg-[#020617] px-6 py-8">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-blue-600">Transport Module</p>
              <h1 className="mt-2 text-3xl font-black text-slate-950">Transport Routes</h1>
              <p className="mt-1 text-sm text-slate-500">Manage city-to-city, airport and intercity route pricing.</p>
            </div>
            <button
              onClick={() => {
                setEditing(emptyRoute);
                setOpen(true);
              }}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg"
            >
              Add New Route
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Stat title="Total Routes" value={stats.total} />
          <Stat title="Active Routes" value={stats.active} />
          <Stat title="Average Base Price" value={`SAR ${stats.avg.toFixed(2)}`} />
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-lg font-black text-slate-950">Route List</h2>
            <p className="text-sm text-slate-500">Edit route pricing and pickup/dropoff location rules.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-4">Route</th>
                  <th className="px-5 py-4">From</th>
                  <th className="px-5 py-4">To</th>
                  <th className="px-5 py-4">Base Price</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {routes.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-bold text-slate-950">{r.route_name}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold">{r.from_city}</p>
                      <p className="text-xs text-slate-500">{r.from_type} — {r.from_location}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold">{r.to_city}</p>
                      <p className="text-xs text-slate-500">{r.to_type} — {r.to_location}</p>
                    </td>
                    <td className="px-5 py-4 font-black">SAR {Number(r.base_price || 0).toFixed(2)}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => {
                          setEditing(r);
                          setOpen(true);
                        }}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold hover:bg-slate-950 hover:text-white"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {open && (
          <Modal title={editing.id ? "Edit Route" : "Add New Route"} onClose={() => setOpen(false)}>
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Route Name" value={editing.route_name} onChange={(v) => setEditing({ ...editing, route_name: v })} />
              <Input label="Base Price SAR" type="number" value={String(editing.base_price)} onChange={(v) => setEditing({ ...editing, base_price: Number(v) })} />
              <Input label="From City" value={editing.from_city} onChange={(v) => setEditing({ ...editing, from_city: v })} />
              <Input label="From Type" value={editing.from_type} onChange={(v) => setEditing({ ...editing, from_type: v })} />
              <Input label="From Location" value={editing.from_location} onChange={(v) => setEditing({ ...editing, from_location: v })} />
              <Input label="To City" value={editing.to_city} onChange={(v) => setEditing({ ...editing, to_city: v })} />
              <Input label="To Type" value={editing.to_type} onChange={(v) => setEditing({ ...editing, to_type: v })} />
              <Input label="To Location" value={editing.to_location} onChange={(v) => setEditing({ ...editing, to_location: v })} />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setOpen(false)} className="rounded-xl border px-5 py-3 text-sm font-bold">Cancel</button>
              <button onClick={saveRoute} className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">Save Route</button>
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

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-black">{title}</h3>
          <button onClick={onClose} className="rounded-full bg-slate-100 px-3 py-1 font-bold">×</button>
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