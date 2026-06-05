const roles = [
  {
    role: "Super Admin",
    access: "Full platform, tenant, security and accounting control",
    level: "Full Access",
  },
  {
    role: "Admin",
    access: "Operations, agents, bookings, reports and settings",
    level: "High Access",
  },
  {
    role: "Accountant",
    access: "Vouchers, ledger, reports, reconciliation and closing",
    level: "Finance Access",
  },
  {
    role: "Agent",
    access: "Own bookings, own ledger, quotes and invoices",
    level: "Limited Access",
  },
];

const guardRules = [
  "Route-level protection",
  "Role-based sidebar visibility",
  "Supabase RLS alignment",
  "Admin-only sensitive modules",
  "Audit log on permission changes",
];

export default function AdminRolesPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8">
      <section className="mx-auto max-w-7xl rounded-[32px] bg-white p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-600">
              Security / Access Control
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-950">
              Roles & Guards
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Manage portal roles, access levels, route guards and permission
              visibility for admin, accountant, agent and tenant users.
            </p>
          </div>

          <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">
            + New Role
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {roles.map((item) => (
            <div
              key={item.role}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <p className="text-lg font-black text-slate-900">{item.role}</p>
              <p className="mt-3 min-h-[60px] text-sm leading-6 text-slate-500">
                {item.access}
              </p>
              <span className="mt-4 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                {item.level}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200">
          <div className="border-b bg-slate-950 px-6 py-4 text-white">
            <h2 className="text-lg font-black">Guard Rules</h2>
          </div>

          <div className="grid gap-0 md:grid-cols-5">
            {guardRules.map((rule) => (
              <div key={rule} className="border-b p-5 md:border-r">
                <p className="font-bold text-slate-800">{rule}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Ready for policy enforcement.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}