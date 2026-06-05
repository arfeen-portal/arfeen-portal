import Link from "next/link";

const financeLinks = [
  {
    title: "Invoices",
    description: "Create, print and download invoices generated from bookings.",
    href: "/accounts/invoices",
    status: "Live",
  },
  {
    title: "Trial Balance",
    description: "Account-wise debit, credit and balance summary.",
    href: "/accounts/trial-balance",
    status: "Live",
  },
  {
    title: "Agent Statements",
    description: "Agent-wise statement, aging and settlement control.",
    href: "/accounts/reports/outstanding",
    status: "Live",
  },
  {
    title: "Vouchers",
    description: "Accounting vouchers, journal entries and posting control.",
    href: "/accounts/vouchers",
    status: "Live",
  },
  {
    title: "Cash Book",
    description: "Cash transaction register with opening and closing balance.",
    href: "/accounts/cash-book",
    status: "Live",
  },
  {
    title: "Bank Book",
    description: "Bank transaction register with references and balances.",
    href: "/accounts/bank-book",
    status: "Live",
  },
];

export default function AccountsHomePage() {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-600">
            Internal Finance
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Accounting Workspace
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Central finance control for invoices, ledgers, vouchers, books and
            reporting.
          </p>
        </section>

        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {financeLinks.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                {item.status}
              </span>
              <h2 className="mt-4 text-xl font-bold text-slate-950">
                {item.title}
              </h2>
              <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-600">
                {item.description}
              </p>
              <span className="mt-5 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                Open Module
              </span>
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}