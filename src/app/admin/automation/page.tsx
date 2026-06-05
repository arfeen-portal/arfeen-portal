const automationCards = [
  {
    title: "Auto WhatsApp Engine",
    status: "Active",
    accuracy: "98%",
    description: "Booking confirmations, driver alerts, payment reminders and voucher sharing.",
  },
  {
    title: "Auto Reminders",
    status: "Active",
    accuracy: "94%",
    description: "Pickup reminders, payment due alerts, hotel check-in and departure reminders.",
  },
  {
    title: "Auto Driver Assign",
    status: "Ready",
    accuracy: "91%",
    description: "Nearest driver matching, vehicle availability and trip priority assignment.",
  },
  {
    title: "Auto Invoice Send",
    status: "Ready",
    accuracy: "89%",
    description: "Send invoices automatically after voucher, booking or payment confirmation.",
  },
  {
    title: "Balance Warning",
    status: "Monitoring",
    accuracy: "96%",
    description: "Agent credit limit, overdue recovery and risky balance alerts.",
  },
  {
    title: "Package Profitability",
    status: "Monitoring",
    accuracy: "92%",
    description: "Auto-check margins before package confirmation and highlight profit leaks.",
  },
];

const activity = [
  "12 WhatsApp messages queued",
  "4 payment reminders pending",
  "2 drivers suggested for new trips",
  "1 low-margin package blocked",
];

export default function AdminAutomationPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8">
      <section className="mx-auto max-w-7xl rounded-[32px] bg-white p-8 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-violet-600">
              Admin Automation
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-950">
              Automation Control Center
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Manage auto WhatsApp, reminders, driver assignment, invoices,
              credit warnings, overdue recovery and package profitability systems.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">
            Automation Health: 94%
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ["Active Automations", "18"],
            ["Pending Queue", "24"],
            ["Failed Jobs", "2"],
            ["Saved Staff Hours", "37h"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl border bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {label}
              </p>
              <h2 className="mt-3 text-4xl font-black text-slate-950">{value}</h2>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {automationCards.map((card) => (
            <div
              key={card.title}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-slate-900">{card.title}</h2>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                  {card.status}
                </span>
              </div>

              <p className="mt-3 min-h-[72px] text-sm leading-6 text-slate-500">
                {card.description}
              </p>

              <div className="mt-5">
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Reliability</span>
                  <span>{card.accuracy}</span>
                </div>
                <div className="mt-2 h-3 rounded-full bg-slate-200">
                  <div className="h-3 rounded-full bg-slate-950" style={{ width: card.accuracy }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl bg-slate-950 p-6 text-white">
            <h2 className="text-xl font-black">Live Automation Queue</h2>
            <div className="mt-5 space-y-3">
              {activity.map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 p-6">
            <h2 className="text-xl font-black text-slate-950">System Logic</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                "Trigger-based actions",
                "Retry engine structure",
                "Failure monitoring",
                "Agent balance rules",
                "Driver availability check",
                "Profit-lock validation",
              ].map((item) => (
                <div key={item} className="rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}