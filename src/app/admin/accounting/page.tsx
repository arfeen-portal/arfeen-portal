const stats = [
  { label: "Voucher Control", value: "128", note: "Posting, locking, reversals" },
  { label: "Pending Approvals", value: "14", note: "Roznamcha & voucher review" },
  { label: "Reconciliation Alerts", value: "9", note: "Mismatch / supplier balance" },
  { label: "Locked Periods", value: "3", note: "Closed accounting periods" },
];

const controls = [
  "Voucher Posting Approval",
  "Day / Month Closing",
  "Reversal Accounting",
  "Suspense Account Monitoring",
  "Forex Gain / Loss Review",
  "Supplier Balance Matching",
];

export default function AccountingAdminPage() {
  return (
    <main className="min-h-screen bg-[#0f172a] px-6 py-8">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[32px] border border-white/10 bg-white p-8 shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-600">
                Admin / Accounting Control
              </p>
              <h1 className="mt-3 text-3xl font-black text-slate-950">
                Accounting Command Center
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                Central control for approvals, voucher locking, reconciliation,
                reversal entries, suspicious posting checks and month-end closing.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
              Dev Mode · Admin
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {stats.map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {item.label}
                </p>
                <h2 className="mt-3 text-4xl font-black text-slate-950">
                  {item.value}
                </h2>
                <p className="mt-2 text-xs text-slate-500">{item.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">
                Control Modules
              </h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {controls.map((control) => (
                  <div
                    key={control}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-slate-800">{control}</p>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                        Ready
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Structure ready for real Supabase data, approvals and audit
                      trail integration.
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
              <h2 className="text-xl font-black">AI Accounting Watch</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                System will highlight duplicate vouchers, mismatched supplier
                ledgers, suspicious reversals, locked-period edits and unusual
                staff posting behavior.
              </p>

              <div className="mt-6 space-y-3">
                {["Duplicate voucher risk", "Supplier mismatch", "Late posting"].map(
                  (item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <p className="font-semibold">{item}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Monitoring structure enabled.
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}