export default function RolesPermissionsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-5">
        <header>
          <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
            Settings
          </p>
          <h1 className="text-xl font-semibold text-slate-900">
            Roles & Permissions (Plan)
          </h1>
          <p className="text-xs text-slate-500">
            High-level access plan for Admin, Agent, Driver & Accountant. Later
            we will enforce this with auth + RLS.
          </p>
        </header>

        <section className="grid gap-3 md:grid-cols-2">
          {/* Admin */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm text-[11px] text-slate-800">
            <p className="text-xs font-semibold text-slate-900">Admin</p>
            <ul className="mt-2 space-y-1">
              <li>• Full access to all bookings & ledgers</li>
              <li>• Create / edit transport & package bookings</li>
              <li>• Manage agents, drivers, prices & routes</li>
              <li>• View & export all reports</li>
              <li>• Manage API keys</li>
            </ul>
          </div>

          {/* Agent */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm text-[11px] text-slate-800">
            <p className="text-xs font-semibold text-slate-900">Agent</p>
            <ul className="mt-2 space-y-1">
              <li>• See only their own bookings</li>
              <li>• Create new transport & Umrah bookings</li>
              <li>• View their own ledger & balance</li>
              <li>• Download their own vouchers only</li>
            </ul>
          </div>

          {/* Driver */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm text-[11px] text-slate-800">
            <p className="text-xs font-semibold text-slate-900">Driver</p>
            <ul className="mt-2 space-y-1">
              <li>• See only assigned trips (date-wise)</li>
              <li>• View passenger name & pickup/drop details</li>
              <li>• Update trip status (on the way, completed)</li>
              <li>• No access to prices / ledger / other agents&apos; data</li>
            </ul>
          </div>

          {/* Accountant */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm text-[11px] text-slate-800">
            <p className="text-xs font-semibold text-slate-900">Accountant</p>
            <ul className="mt-2 space-y-1">
              <li>• Read-only access to all bookings</li>
              <li>• Full access to ledger & payment screens</li>
              <li>• Can export statements & reports</li>
              <li>• Cannot delete bookings or change prices</li>
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm text-[11px] text-slate-700">
          <p className="text-xs font-semibold text-slate-900">Next steps</p>
          <ul className="mt-2 space-y-1">
            <li>• Add auth system (Supabase auth or custom)</li>
            <li>• Map each user to a role in database</li>
            <li>• Hide/show menu items based on role</li>
            <li>• Add database RLS policies per role</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
