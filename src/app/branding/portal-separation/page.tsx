const portalTypes = [
  {
    name: "Master Backend",
    route: "localhost:3000",
    purpose:
      "Original admin backend. Tenants, modules, accounts, operations, branding aur approvals yahin se manage honge.",
    access: "Internal Admin",
    status: "Protected",
  },
  {
    name: "Client Public Portal",
    route: "arfeenportal.com",
    purpose:
      "White-label customer-facing website. Sirf approved modules aur public pages show honge.",
    access: "Customers",
    status: "Tenant Scoped",
  },
  {
    name: "Agent Portal",
    route: "/agent",
    purpose:
      "B2B agents ke liye bookings, ledgers, invoices, quotations aur package sales.",
    access: "B2B Agents",
    status: "Own Data Only",
  },
  {
    name: "Driver Portal",
    route: "/driver",
    purpose:
      "Driver trips, pickup status, vehicle tracking, duty updates aur operational access.",
    access: "Drivers",
    status: "Limited Access",
  },
];

const separationRules = [
  "Master backend domain public tenant domain se separate rahega",
  "Har tenant ka theme, domain aur modules independent rahenge",
  "Middleware host se tenant detect karega",
  "Role-based route protection admin/accounts/agent/driver ko guard karegi",
  "Agent ko sirf apna data show hoga",
  "Client public domain par backend sidebar kabhi show nahi hoga",
  "Tenant approval ke baghair Go Live nahi hoga",
  "Domain verified hone ke baad live flag enable hoga",
];

const launchChecklist = [
  {
    title: "Domain Detection",
    detail: "Host header / cookie se tenant identify hoga.",
  },
  {
    title: "Theme Injection",
    detail: "Tenant ke colors, logo, login text aur public UI apply honge.",
  },
  {
    title: "Module Gate",
    detail: "Allowed modules ke ilawa koi route public nahi hoga.",
  },
  {
    title: "Data Isolation",
    detail: "tenant_id / agent_id based filtering mandatory rahegi.",
  },
  {
    title: "Approval Flow",
    detail: "Pending → Approved → Go Live flow ke baghair launch nahi hoga.",
  },
  {
    title: "Kill Switch",
    detail: "Blocked/paused domain ko instantly disable kiya ja sakega.",
  },
];

export default function PortalSeparationPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8">
      <section className="mx-auto max-w-7xl rounded-[32px] border border-white/10 bg-white p-8 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-purple-600">
              White-label Architecture
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-950">
              Portal Separation Engine
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Master backend, client public website, agent dashboard aur driver
              portal ko domain, theme, route guard aur tenant isolation ke sath
              clearly separate rakhta hai.
            </p>
          </div>

          <div className="rounded-2xl bg-purple-100 px-5 py-3 text-sm font-black text-purple-700">
            Multi-Portal Ready
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ["Portal Types", "4"],
            ["Guard Layers", "8"],
            ["Tenant Isolation", "Active"],
            ["White-label Mode", "Ready"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {label}
              </p>
              <h2 className="mt-3 text-3xl font-black text-slate-950">
                {value}
              </h2>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {portalTypes.map((portal) => (
            <div
              key={portal.name}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    {portal.name}
                  </h2>
                  <p className="mt-1 text-xs font-black text-blue-600">
                    {portal.route}
                  </p>
                </div>

                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                  {portal.access}
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                {portal.purpose}
              </p>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
                Status: {portal.status}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl bg-slate-950 p-6 text-white">
            <h2 className="text-xl font-black">Final Separation Logic</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Master backend localhost/development control ke liye rahega.
              Client domain par sirf approved public tenant experience load
              hoga. Har request pe domain, role, tenant aur module guard check
              hoga, taake kisi tenant ka data doosre tenant se mix na ho.
            </p>

            <div className="mt-6 grid gap-3">
              {separationRules.map((rule) => (
                <div
                  key={rule}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-bold text-slate-200"
                >
                  {rule}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-black text-slate-950">
              Launch Readiness Checklist
            </h2>

            <div className="mt-5 grid gap-3">
              {launchChecklist.map((item, index) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-sm font-black text-purple-700">
                      {index + 1}
                    </div>
                    <h3 className="font-black text-slate-950">{item.title}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}