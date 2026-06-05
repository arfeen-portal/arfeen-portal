export const dynamic = "force-dynamic";
export const revalidate = 0;

const integrations = [
  {
    name: "WhatsApp Engine",
    status: "Ready",
    description: "Booking alerts, voucher delivery, reminders and recovery messages.",
  },
  {
    name: "Payment Gateway",
    status: "Pending",
    description: "Online payment collection, invoice payment links and settlement tracking.",
  },
  {
    name: "Supplier API",
    status: "Planned",
    description: "Hotel, transport, airline and marketplace supplier integrations.",
  },
  {
    name: "Google Maps",
    status: "Ready",
    description: "Live locator, driver tracking, geofence and route intelligence.",
  },
  {
    name: "Email SMTP",
    status: "Ready",
    description: "Invoices, vouchers, tenant onboarding and system notifications.",
  },
  {
    name: "AI Services",
    status: "Ready",
    description: "AI planner, fraud detection, smart recommendations and analytics.",
  },
];

export default function IntegrationsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Integrations
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage external APIs, automation engines and connected services.
            </p>
          </div>

          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800">
            Add Integration
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {integrations.map((item) => (
            <div
              key={item.name}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold text-slate-900">{item.name}</h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    item.status === "Ready"
                      ? "bg-emerald-50 text-emerald-700"
                      : item.status === "Pending"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.description}
              </p>

              <button className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Configure
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}