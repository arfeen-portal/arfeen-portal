const summaryCards = [
  { label: "Total Sales", value: "SAR 284,500", note: "+18% this month" },
  { label: "Gross Profit", value: "SAR 72,300", note: "25.4% margin" },
  { label: "Receivables", value: "SAR 41,900", note: "Agent outstanding" },
  { label: "Payables", value: "SAR 29,600", note: "Supplier balance" },
];

const reportBlocks = [
  "Sales Reports",
  "Travel Reports",
  "Financial Analytics",
  "Cash Flow",
  "Profit & Loss",
  "Trial Balance",
  "Agent Outstanding",
  "Supplier Performance",
];

export default function ReportsDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8">
      <section className="mx-auto max-w-7xl rounded-[32px] bg-white p-8 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-indigo-600">
              Reports Command Center
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-950">
              Dashboard Summary
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Complete reporting overview for sales, profit, cash flow, agent
              outstanding, supplier balances, bookings and travel operations.
            </p>
          </div>

          <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">
            Export Summary
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{card.label}</p>
              <h2 className="mt-3 text-2xl font-black text-slate-950">{card.value}</h2>
              <p className="mt-2 text-xs font-semibold text-emerald-600">{card.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 p-6">
            <h2 className="text-xl font-black text-slate-950">Report Modules</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {reportBlocks.map((item) => (
                <div key={item} className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-slate-950 p-6 text-white">
            <h2 className="text-xl font-black">AI Report Intelligence</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Future engine can detect profit leaks, weak agents, loss-making
              routes, suspicious refunds, supplier delays and cashflow pressure.
            </p>
            <div className="mt-6 space-y-3">
              {["Profit leak watch", "Agent risk score", "Supplier pressure"].map((x) => (
                <div key={x} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-bold">
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