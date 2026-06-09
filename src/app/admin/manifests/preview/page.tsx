const passengers = [
  {
    name: "Muhammad Ali",
    group: "UMR-2026-01",
    service: "Jeddah Airport to Makkah Hotel",
    vehicle: "GMC",
    status: "Confirmed",
  },
  {
    name: "Fatima Bibi",
    group: "UMR-2026-01",
    service: "Makkah Hotel to Madinah",
    vehicle: "Hiace",
    status: "Ready",
  },
  {
    name: "VIP Guest",
    group: "VIP-1007",
    service: "Madinah Hotel to Airport",
    vehicle: "Premium Car",
    status: "Pending Driver",
  },
];

const checks = [
  "Passenger count verified",
  "Vehicle capacity matched",
  "Pickup time confirmed",
  "Driver assignment pending check",
  "WhatsApp share ready",
];

export default function ManifestPreviewPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8">
      <section className="mx-auto max-w-7xl rounded-[32px] bg-white p-8 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-600">
              Operations Manifest
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-950">
              Passenger Manifest Preview
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Preview passenger movement, group details, assigned vehicle,
              service route and operational readiness before sharing with team.
            </p>
          </div>

          <div className="flex gap-3">
            <button className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700">
              Export PDF
            </button>
            <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">
              Share WhatsApp
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ["Passengers", "37"],
            ["Groups", "4"],
            ["Vehicles", "6"],
            ["Pending Assignments", "2"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl border bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {label}
              </p>
              <h2 className="mt-3 text-4xl font-black text-slate-950">{value}</h2>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-3xl border border-slate-200">
            <div className="bg-slate-950 px-6 py-4 text-white">
              <h2 className="text-lg font-black">Manifest Passenger List</h2>
            </div>

            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-5 py-4 text-left">Passenger</th>
                  <th className="px-5 py-4 text-left">Group</th>
                  <th className="px-5 py-4 text-left">Service</th>
                  <th className="px-5 py-4 text-left">Vehicle</th>
                  <th className="px-5 py-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {passengers.map((row) => (
                  <tr key={row.name} className="border-t hover:bg-slate-50">
                    <td className="px-5 py-4 font-bold text-slate-900">{row.name}</td>
                    <td className="px-5 py-4">{row.group}</td>
                    <td className="px-5 py-4">{row.service}</td>
                    <td className="px-5 py-4">{row.vehicle}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-3xl border border-slate-200 p-6">
            <h2 className="text-xl font-black text-slate-950">Pre-Dispatch Checks</h2>
            <div className="mt-5 space-y-3">
              {checks.map((check) => (
                <div key={check} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-700">{check}</p>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                    OK
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-3xl bg-slate-950 p-5 text-white">
              <p className="text-sm font-bold">Manifest Intelligence</p>
              <p className="mt-2 text-xs leading-5 text-slate-300">
                System can later detect over-capacity vehicles, missing driver,
                wrong pickup city, duplicate passenger and late departure risk.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}