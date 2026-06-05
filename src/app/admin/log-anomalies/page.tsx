const anomalies = [
  {
    title: "Unusual Admin Activity",
    risk: "High",
    detail: "Multiple sensitive admin pages opened in short time.",
    action: "Review session and permission scope",
  },
  {
    title: "Refund Pattern Alert",
    risk: "Medium",
    detail: "Repeated refund actions detected against same supplier group.",
    action: "Check refund approval trail",
  },
  {
    title: "API Failure Spike",
    risk: "Low",
    detail: "Some admin API routes returned failed responses.",
    action: "Review route handlers and Supabase connection",
  },
];

export default function LogAnomaliesPage() {
  return (
    <main className="min-h-screen bg-[#0f172a] px-6 py-8">
      <section className="mx-auto max-w-7xl rounded-[32px] bg-white p-8 shadow-2xl">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-red-600">
            AI Security Watch
          </p>
          <h1 className="mt-3 text-3xl font-black text-slate-950">
            Log Anomaly Detection
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Detect suspicious activity, failed API spikes, unusual refunds,
            abnormal staff behavior and security-sensitive movement.
          </p>
        </div>

        <div className="mt-8 grid gap-5">
          {anomalies.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-black text-slate-900">
                  {item.title}
                </h2>
                <span className="rounded-full bg-red-100 px-4 py-1 text-xs font-black text-red-700">
                  {item.risk} Risk
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {item.detail}
              </p>

              <div className="mt-4 rounded-2xl bg-white p-4 text-sm font-semibold text-slate-700">
                Recommended Action: {item.action}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}