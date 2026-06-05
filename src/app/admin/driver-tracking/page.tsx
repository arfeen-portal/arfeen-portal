const drivers = [
  {
    name: "Ahmed Driver",
    vehicle: "GMC Yukon",
    plate: "KSA-7421",
    city: "Makkah",
    status: "Online",
    trip: "Hotel to Haram",
    eta: "08 min",
  },
  {
    name: "Bilal Driver",
    vehicle: "Toyota Hiace",
    plate: "KSA-1189",
    city: "Jeddah Airport",
    status: "On Trip",
    trip: "Airport to Makkah",
    eta: "42 min",
  },
  {
    name: "Salman Driver",
    vehicle: "Coaster",
    plate: "KSA-6672",
    city: "Madinah",
    status: "Idle",
    trip: "Available",
    eta: "Ready",
  },
];

const alerts = [
  "1 delayed airport pickup detected",
  "2 vehicles available near Jeddah Airport",
  "VIP booking needs premium vehicle assignment",
];

export default function DriverTrackingPage() {
  return (
    <main className="min-h-screen bg-[#0f172a] px-6 py-8">
      <section className="mx-auto max-w-7xl rounded-[32px] bg-white p-8 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-600">
              Transport Operations
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-950">
              Driver Live Tracking Center
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Monitor active drivers, live trips, vehicle availability, delayed
              pickups, airport movement and VIP transport priority.
            </p>
          </div>

          <div className="rounded-2xl bg-emerald-100 px-5 py-3 text-sm font-black text-emerald-700">
            Live Tracking Ready
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ["Online Drivers", "21"],
            ["Active Trips", "9"],
            ["Delayed Trips", "1"],
            ["Idle Vehicles", "12"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl border bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {label}
              </p>
              <h2 className="mt-3 text-4xl font-black text-slate-950">{value}</h2>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl bg-slate-950 p-6 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black">Live Map Panel</h2>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                Map API Placeholder
              </span>
            </div>

            <div className="mt-5 h-[360px] rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-6">
              <div className="grid h-full place-items-center rounded-2xl border border-dashed border-white/20">
                <div className="text-center">
                  <p className="text-2xl font-black">Saudi Live Fleet Map</p>
                  <p className="mt-2 text-sm text-slate-400">
                    Google Maps / Leaflet integration can connect here later.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 p-6">
            <h2 className="text-xl font-black text-slate-950">Operational Alerts</h2>
            <div className="mt-5 space-y-3">
              {alerts.map((alert) => (
                <div key={alert} className="rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800">
                  {alert}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-950 text-white">
              <tr>
                <th className="px-5 py-4 text-left">Driver</th>
                <th className="px-5 py-4 text-left">Vehicle</th>
                <th className="px-5 py-4 text-left">Plate</th>
                <th className="px-5 py-4 text-left">City</th>
                <th className="px-5 py-4 text-left">Trip</th>
                <th className="px-5 py-4 text-left">ETA</th>
                <th className="px-5 py-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => (
                <tr key={driver.plate} className="border-t hover:bg-slate-50">
                  <td className="px-5 py-4 font-bold text-slate-900">{driver.name}</td>
                  <td className="px-5 py-4">{driver.vehicle}</td>
                  <td className="px-5 py-4">{driver.plate}</td>
                  <td className="px-5 py-4">{driver.city}</td>
                  <td className="px-5 py-4">{driver.trip}</td>
                  <td className="px-5 py-4 font-bold">{driver.eta}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                      {driver.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}