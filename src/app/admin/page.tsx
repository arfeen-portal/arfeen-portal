import { getDashboardData } from "./dashboard/actions/getDashboardData";

export default async function AdminDashboard() {
  const data = await getDashboardData();

  return (
    <main className="space-y-5">
      <h1 className="text-xl font-bold">Admin Dashboard</h1>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-white border p-4">
          <p className="text-xs text-slate-500">Transport Today</p>
          <p className="text-2xl font-semibold">{data.todayTransport}</p>
        </div>

        <div className="rounded-xl bg-white border p-4">
          <p className="text-xs text-slate-500">Packages Today</p>
          <p className="text-2xl font-semibold">{data.todayPackages}</p>
        </div>

        <div className="rounded-xl bg-white border p-4">
          <p className="text-xs text-slate-500">Total Revenue</p>
          <p className="text-2xl font-semibold">{data.totalRevenue} SAR</p>
        </div>
      </div>

      <div className="rounded-xl bg-white border p-4">
        <p className="text-sm font-semibold">Top Routes</p>
        <ul className="mt-2 text-sm">
          {data.topRoutes.map((r, i) => (
            <li key={i} className="py-1">
              {r.route} — <b>{r.count}</b>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
