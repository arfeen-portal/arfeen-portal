const plStats = [
  { label: "Revenue", value: "SAR 284,500" },
  { label: "Direct Cost", value: "SAR 198,200" },
  { label: "Gross Profit", value: "SAR 86,300" },
  { label: "Net Profit", value: "SAR 61,700" },
];

const rows = [
  { item: "Umrah Packages", revenue: "SAR 142,000", cost: "SAR 101,500", profit: "SAR 40,500" },
  { item: "Transport", revenue: "SAR 68,400", cost: "SAR 42,900", profit: "SAR 25,500" },
  { item: "Hotels", revenue: "SAR 51,300", cost: "SAR 39,600", profit: "SAR 11,700" },
  { item: "Flights / BSP", revenue: "SAR 22,800", cost: "SAR 14,200", profit: "SAR 8,600" },
];

export default function ProfitLossReportPage() {
  return (
    <main className="min-h-screen bg-[#0f172a] px-6 py-8">
      <section className="mx-auto max-w-7xl rounded-[32px] bg-white p-8 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-rose-600">
              Profitability Reports
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-950">
              Profit & Loss Report
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Analyze revenue, direct cost, gross profit, net profit, product-wise
              margin and loss-making travel segments.
            </p>
          </div>

          <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">
            Export P&L
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {plStats.map((item) => (
            <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.label}</p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">{item.value}</h2>
            </div>
          ))}
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200">
          <div className="bg-slate-950 px-6 py-4 text-white">
            <h2 className="text-lg font-black">Product-wise Profitability</h2>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-5 py-4 text-left">Product</th>
                <th className="px-5 py-4 text-left">Revenue</th>
                <th className="px-5 py-4 text-left">Cost</th>
                <th className="px-5 py-4 text-left">Profit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.item} className="border-t hover:bg-slate-50">
                  <td className="px-5 py-4 font-bold text-slate-900">{row.item}</td>
                  <td className="px-5 py-4">{row.revenue}</td>
                  <td className="px-5 py-4 text-red-700">{row.cost}</td>
                  <td className="px-5 py-4 font-black text-emerald-700">{row.profit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-slate-950 p-6 text-white">
            <h2 className="text-xl font-black">Profit Leak Detector</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Future AI can detect weak margins, over-discounted packages,
              high-cost suppliers and low-profit routes automatically.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 p-6">
            <h2 className="text-xl font-black text-slate-950">Margin Controls</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {["Minimum margin check", "Supplier cost variance", "Agent discount control", "Route profit ranking"].map((x) => (
                <div key={x} className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700">
                  {x}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}