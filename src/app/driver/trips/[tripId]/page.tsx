type PageProps = {
  params: { tripId: string };
};

export default function DriverTripDetailPage({ params }: PageProps) {
  const tripId = params.tripId;

  // Abhi dummy data – future mein Supabase se fetch kar lena
  const trip = {
    ref: tripId,
    route: "Jeddah Airport → Makkah Hotel",
    date: "24 Nov 2025",
    time: "10:30",
    vehicle: "GMC Yukon – Black",
    passengers: 5,
    pickupPoint: "North Terminal, Exit 5",
    dropoffPoint: "Swissotel Makkah",
    contactName: "Syed Muhammad",
    contactPhone: "+966 5X XXX XXXX",
    notes: "Wait with Arfeen Travel board at arrival area.",
    status: "assigned",
  };

  return (
    <main className="space-y-4 text-[11px] text-slate-100">
      <header className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
            Trip Details
          </p>
          <h1 className="text-lg font-semibold text-slate-50">
            {trip.route}
          </h1>
          <p className="text-[11px] text-slate-400">
            Ref {trip.ref} · {trip.date} at {trip.time}
          </p>
        </div>
        <span className="rounded-full bg-amber-50/10 px-3 py-1 text-[10px] font-medium text-amber-200">
          Status: {trip.status}
        </span>
      </header>

      <section className="grid gap-3 md:grid-cols-[2fr_1.2fr]">
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
            <p className="text-[11px] font-semibold text-slate-100">
              Route & Timing
            </p>
            <p className="mt-1 text-slate-200">{trip.route}</p>
            <p className="mt-1 text-slate-400">
              Date: <span className="font-medium">{trip.date}</span> · Time:{" "}
              <span className="font-medium">{trip.time}</span>
            </p>
            <p className="mt-1 text-slate-400">
              Vehicle: <span className="font-medium">{trip.vehicle}</span> ·{" "}
              {trip.passengers} pax
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
            <p className="text-[11px] font-semibold text-slate-100">
              Pickup & Dropoff
            </p>
            <div className="mt-1 grid gap-2 md:grid-cols-2">
              <div>
                <p className="text-slate-400">Pickup</p>
                <p className="font-medium text-slate-100">
                  {trip.pickupPoint}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Dropoff</p>
                <p className="font-medium text-slate-100">
                  {trip.dropoffPoint}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
            <p className="text-[11px] font-semibold text-slate-100">
              Passenger Contact
            </p>
            <p className="mt-1 text-slate-200">{trip.contactName}</p>
            <p className="text-slate-300">{trip.contactPhone}</p>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
            <p className="text-[11px] font-semibold text-slate-100">
              Quick Status
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              Future: yahan se driver button press karega aur status admin ko
              update ho jayega.
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
              <button className="rounded-xl bg-slate-800 px-3 py-1 font-medium hover:bg-slate-700">
                I am on the way
              </button>
              <button className="rounded-xl bg-slate-800 px-3 py-1 font-medium hover:bg-slate-700">
                I have reached pickup
              </button>
              <button className="rounded-xl bg-slate-800 px-3 py-1 font-medium hover:bg-slate-700">
                Trip completed
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
            <p className="text-[11px] font-semibold text-slate-100">
              Notes from Office
            </p>
            <p className="mt-1 text-slate-300">{trip.notes}</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
