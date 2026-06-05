export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">
          System Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage global portal settings, tenant defaults, branding rules and system preferences.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="font-medium text-slate-900">Portal Mode</h2>
            <p className="mt-1 text-sm text-slate-500">
              Multi-tenant white-label SaaS mode enabled.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="font-medium text-slate-900">Branding Engine</h2>
            <p className="mt-1 text-sm text-slate-500">
              Tenant-wise logo, theme, invoice and domain branding supported.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="font-medium text-slate-900">Security</h2>
            <p className="mt-1 text-sm text-slate-500">
              Role-based access, audit logs and approval gates ready.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}