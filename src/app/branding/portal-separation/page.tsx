const portalTypes = [
  {
    name: "Admin Portal",
    route: "/admin",
    purpose: "Super admin, system configuration, tenants, users and security.",
    access: "Internal Team",
  },
  {
    name: "Agent Portal",
    route: "/agent",
    purpose: "Agent bookings, ledgers, invoices, quotations and package sales.",
    access: "B2B Agents",
  },
  {
    name: "Public Portal",
    route: "/",
    purpose: "Public landing pages, AI planner, package inquiry and lead capture.",
    access: "Customers",
  },
  {
    name: "Driver Portal",
    route: "/driver",
    purpose: "Driver trips, pickup status, vehicle tracking and duty updates.",
    access: "Drivers",
  },
];

const separationRules = [
  "Separate sidebar per portal",
  "Separate theme per tenant",
  "Domain-based tenant detection",
  "Role-based route protection",
  "Agent data isolation",
  "Public lead capture routing",
  "Driver-only operational access",
  "Admin approval before live",
];

export default function PortalSeparationPage() {
  return (
    <main className="min-h-screen bg-[#0f172a] px-6 py-8">
      <section className="mx-auto max-w-7xl rounded-[32px] bg-white p-8 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-purple-600">
              White-label Architecture
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-950">
              Portal Separation Engine
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Separate admin, agent, public and driver experiences with domain
              mapping, tenant themes, route guards and data isolation logic.
            </p>
          </div>

          <div className="rounded-2xl bg-purple-100 px-5 py-3 text-sm font-black text-purple-700">
            Multi-Portal Ready
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ["Portal Types", "4"],
            ["Guard Layers", "7"],
            ["Tenant Isolation", "Active"],
            ["White-label Mode", "Ready"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">{value}</h2>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {portalTypes.map((portal) => (
            <div key={portal.name} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-950">{portal.name}</h2>
                  <p className="mt-1 text-xs font-bold text-blue-600">{portal.route}</p>
                </div>
                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                  {portal.access}
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                {portal.purpose}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl bg-slate-950 p-6 text-white">
            <h2 className="text-xl font-black">Separation Logic</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Each portal should load its own sidebar, permissions, UI theme,
              route guard and tenant scope. This keeps agent/customer/driver/admin
              experiences clean and secure.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {separationRules.map((rule) => (
              <div key={rule} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700">
                {rule}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}