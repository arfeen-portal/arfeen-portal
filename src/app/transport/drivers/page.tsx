// src/app/transport/drivers/page.tsx

import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Driver = {
  id: string;
  full_name: string;
  phone: string | null;
  whatsapp: string | null;
  license_number: string | null;
  is_active: boolean;
  notes: string | null;
};

export default async function DriversPage() {
  const supabase = getSupabaseAdminSafe();

  let drivers: Driver[] = [];
  let errorMessage = "";

  if (!supabase) {
    errorMessage = "Supabase admin client is not configured.";
  } else {
    const { data, error } = await supabase
      .from("transport_drivers")
      .select("*")
      .order("full_name", { ascending: true });

    if (error) {
      errorMessage = error.message;
    } else {
      drivers = (data || []) as Driver[];
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-800 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">
                Transport Module
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-950">
                Drivers
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage driver records, WhatsApp contacts, license details and active status.
              </p>
            </div>

            <a
              href="/transport/drivers/new"
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              Add New Driver
            </a>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard title="Total Drivers" value={String(drivers.length)} />
          <StatCard
            title="Active Drivers"
            value={String(drivers.filter((d) => d.is_active).length)}
          />
          <StatCard
            title="Inactive Drivers"
            value={String(drivers.filter((d) => !d.is_active).length)}
          />
        </section>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Error loading drivers: {errorMessage}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-bold text-slate-950">Driver List</h2>
            <p className="text-sm text-slate-500">
              Active drivers can be assigned to transport bookings.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-slate-600">Name</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-600">Phone</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-600">WhatsApp</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-600">License</th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-600">Active</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-600">Notes</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {drivers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                      No drivers found yet.
                    </td>
                  </tr>
                ) : (
                  drivers.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-semibold text-slate-950">
                        {d.full_name}
                      </td>
                      <td className="px-6 py-4 text-slate-700">{d.phone || "—"}</td>
                      <td className="px-6 py-4 text-slate-700">{d.whatsapp || "—"}</td>
                      <td className="px-6 py-4 text-slate-700">{d.license_number || "—"}</td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                            d.is_active
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {d.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {d.notes || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}