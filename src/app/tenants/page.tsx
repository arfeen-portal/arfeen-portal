export const dynamic = "force-dynamic";
export const revalidate = 0;

type Tenant = {
  id?: string;
  name?: string;
  domain?: string;
  status?: string;
  plan?: string;
};

async function getTenants(): Promise<Tenant[]> {
  try {
    return [];
  } catch {
    return [];
  }
}

export default async function TenantsPage() {
  const tenants = await getTenants();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Tenants</h1>
            <p className="mt-1 text-sm text-slate-500">
              White-label SaaS clients, domains and portal status.
            </p>
          </div>

          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800">
            Add Tenant
          </button>
        </div>

        {tenants.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <h2 className="text-sm font-semibold text-slate-900">
              No tenants found
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              SQL run hone ke baad yahan tenants show honge.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Tenant</th>
                  <th className="px-4 py-3">Domain</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {tenants.map((tenant) => (
                  <tr key={tenant.id ?? tenant.name}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {tenant.name ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {tenant.domain ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {tenant.plan ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        {tenant.status ?? "Active"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}