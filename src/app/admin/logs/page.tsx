const logs = [
  {
    id: "LOG-1001",
    action: "Admin login",
    module: "Security",
    user: "Admin",
    status: "Success",
    time: "Today 10:15",
  },
  {
    id: "LOG-1002",
    action: "Voucher approval opened",
    module: "Accounting",
    user: "Accountant",
    status: "Info",
    time: "Today 10:32",
  },
  {
    id: "LOG-1003",
    action: "Suspicious refund pattern checked",
    module: "AI Watch",
    user: "System",
    status: "Warning",
    time: "Today 11:02",
  },
];

export default function AdminLogsPage() {
  const safeLogs = Array.isArray(logs) ? logs : [];

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8">
      <section className="mx-auto max-w-7xl rounded-[32px] bg-white p-8 shadow-xl">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-600">
            System Monitoring
          </p>
          <h1 className="mt-3 text-3xl font-black text-slate-950">
            Centralized System Logs
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Track admin actions, security events, route activity, accounting
            changes and AI system alerts.
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-950 text-white">
              <tr>
                <th className="px-5 py-4 text-left">Log ID</th>
                <th className="px-5 py-4 text-left">Action</th>
                <th className="px-5 py-4 text-left">Module</th>
                <th className="px-5 py-4 text-left">User</th>
                <th className="px-5 py-4 text-left">Status</th>
                <th className="px-5 py-4 text-left">Time</th>
              </tr>
            </thead>
            <tbody>
              {safeLogs.map((log) => (
                <tr key={log.id} className="border-t bg-white hover:bg-slate-50">
                  <td className="px-5 py-4 font-bold text-slate-800">{log.id}</td>
                  <td className="px-5 py-4">{log.action}</td>
                  <td className="px-5 py-4">{log.module}</td>
                  <td className="px-5 py-4">{log.user}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      {log.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}