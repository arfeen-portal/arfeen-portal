const cashStats = [
  { label: "Opening Balance", value: "SAR 52,000" },
  { label: "Cash Inflow", value: "SAR 184,600" },
  { label: "Cash Outflow", value: "SAR 126,300" },
  { label: "Closing Balance", value: "SAR 110,300" },
];

const cashRows = [
  { head: "Agent Collections", inflow: "SAR 92,400", outflow: "-", net: "SAR 92,400" },
  { head: "Supplier Payments", inflow: "-", outflow: "SAR 61,800", net: "-SAR 61,800" },
  { head: "Transport Revenue", inflow: "SAR 38,200", outflow: "SAR 14,600", net: "SAR 23,600" },
  { head: "Hotel Settlements", inflow: "SAR 54,000", outflow: "SAR 49,900", net: "SAR 4,100" },
];

export default function CashFlowReportPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8">
      <section className="mx-auto max-w-7xl rounded-[32px] bg-white p-8 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-emerald-600">
              Financial Reports
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-950">
              Cash Flow Report
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Track cash inflow, outflow, agent collections, supplier payments,
              transport revenue and month-wise liquidity position.
            </p>
          </div>

          <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">
            Export Cash Flow
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {cashStats.map((item) => (
            <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">{item.value}</h2>
            </div>
          ))}
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200">
          <div className="bg-slate-950 px-6 py-4 text-white">
            <h2 className="text-lg font-black">Cash Movement Summary</h2>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-5 py-4 text-left">Head</th>
                <th className="px-5 py-4 text-left">Inflow</th>
                <th className="px-5 py-4 text-left">Outflow</th>
                <th className="px-5 py-4 text-left">Net</th>
              </tr>
            </thead>
            <tbody>
              {cashRows.map((row) => (
                <tr key={row.head} className="border-t hover:bg-slate-50">
                  <td className="px-5 py-4 font-bold text-slate-900">{row.head}</td>
                  <td className="px-5 py-4 text-emerald-700">{row.inflow}</td>
                  <td className="px-5 py-4 text-red-700">{row.outflow}</td>
                  <td className="px-5 py-4 font-black text-slate-900">{row.net}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 rounded-3xl bg-slate-950 p-6 text-white">
          <h2 className="text-xl font-black">Cashflow Intelligence</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            System can later forecast low cash days, overdue agent payments,
            supplier pressure and risky booking periods.
          </p>
        </div>
      </section>
    </main>
  );
}