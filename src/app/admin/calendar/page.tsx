const MOCK_BOOKINGS = [
  { date: "2025-11-24", type: "transport", label: "JED → MAK (GMC)" },
  { date: "2025-11-24", type: "package", label: "20N Umrah – Syed Family" },
  { date: "2025-11-25", type: "transport", label: "MAK → MED (Coaster)" },
];

function getDayBookings(day: number) {
  // just for demo — real logic later
  if (day === 24) return MOCK_BOOKINGS.slice(0, 2);
  if (day === 25) return MOCK_BOOKINGS.slice(2);
  return [];
}

export default function BookingCalendarPage() {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-5">
        <header>
          <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
            Calendar
          </p>
          <h1 className="text-xl font-semibold text-slate-900">
            Bookings Calendar (Sample Month)
          </h1>
          <p className="text-xs text-slate-500">
            High-level view of transport & package bookings per day. Later we
            will connect this to Supabase.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-7 gap-2 text-[11px] text-slate-600">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="text-center text-[10px] font-medium">
                {d}
              </div>
            ))}

            {days.map((day) => {
              const bookings = getDayBookings(day);
              return (
                <div
                  key={day}
                  className="min-h-[70px] rounded-xl border border-slate-100 bg-slate-50 p-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-700">
                      {day}
                    </span>
                    {bookings.length > 0 && (
                      <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-600">
                        {bookings.length}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 space-y-0.5">
                    {bookings.map((b, i) => (
                      <div
                        key={i}
                        className={`truncate rounded-md px-1 py-0.5 text-[9px] ${
                          b.type === "transport"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {b.label}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
