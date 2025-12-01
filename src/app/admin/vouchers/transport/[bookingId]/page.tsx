type PageProps = {
  params: { bookingId: string };
};

export default function TransportVoucherPage({ params }: PageProps) {
  const { bookingId } = params;

  // Abhi dummy data – baad mein booking table se hydrate karna
  const voucher = {
    bookingReference: bookingId,
    passengerName: "Arfeen Group A",
    passengers: 5,
    route: "Jeddah Airport (JED) → Makkah Hotel",
    date: "24 Nov 2025",
    time: "10:30",
    vehicleType: "GMC",
    vehicleDetails: "GMC Yukon – Black",
    driverName: "Ahmed Ali",
    driverPhone: "+966 5X XXX XXXX",
    pickupPoint: "North Terminal Arrival Gate – Exit 5",
    dropoffPoint: "Swissotel Makkah – Main lobby",
    notes: "Driver will wait with Arfeen Travel name-board at arrival area.",
  };

  return (
    <main className="min-h-screen bg-slate-100 py-6">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
              Arfeen Travel
            </p>
            <h1 className="text-lg font-semibold text-slate-900">
              Transport Voucher
            </h1>
            <p className="text-[11px] text-slate-500">
              Please show this voucher to the driver at pickup.
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-500">
            <p>Booking Ref</p>
            <p className="font-mono text-xs font-semibold text-slate-900">
              {voucher.bookingReference}
            </p>
          </div>
        </header>

        {/* Main layout */}
        <section className="mt-4 grid gap-4 md:grid-cols-[2fr_1.1fr]">
          {/* Left side */}
          <div className="space-y-3 text-[11px]">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[11px] font-semibold text-slate-800">
                Passenger Details
              </p>
              <div className="mt-1 grid gap-1 md:grid-cols-2">
                <div>
                  <p className="text-slate-500">Lead passenger / group</p>
                  <p className="font-medium text-slate-900">
                    {voucher.passengerName}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Total passengers</p>
                  <p className="font-medium text-slate-900">
                    {voucher.passengers}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[11px] font-semibold text-slate-800">
                Route & Timing
              </p>
              <div className="mt-1 space-y-1">
                <p className="text-slate-900">{voucher.route}</p>
                <p className="text-slate-600">
                  Date:{" "}
                  <span className="font-medium">{voucher.date}</span> · Time:{" "}
                  <span className="font-medium">{voucher.time}</span>
                </p>
                <p className="text-slate-600">
                  Vehicle:{" "}
                  <span className="font-medium">{voucher.vehicleType}</span>{" "}
                  · {voucher.vehicleDetails}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[11px] font-semibold text-slate-800">
                Pickup & Dropoff
              </p>
              <div className="mt-1 grid gap-2 md:grid-cols-2">
                <div>
                  <p className="text-slate-500">Pickup point</p>
                  <p className="font-medium text-slate-900">
                    {voucher.pickupPoint}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Dropoff point</p>
                  <p className="font-medium text-slate-900">
                    {voucher.dropoffPoint}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[11px] font-semibold text-slate-800">
                Important Notes
              </p>
              <p className="mt-1 text-slate-700">{voucher.notes}</p>
              <ul className="mt-2 space-y-1 text-slate-500">
                <li>• Please keep your phone reachable on WhatsApp.</li>
                <li>• In case of any issue, contact Arfeen support immediately.</li>
              </ul>
            </div>
          </div>

          {/* Right side */}
          <aside className="space-y-3 text-[11px]">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[11px] font-semibold text-slate-800">
                Driver Details
              </p>
              <p className="mt-1 text-slate-600">
                Name:{" "}
                <span className="font-medium">{voucher.driverName}</span>
              </p>
              <p className="text-slate-600">
                Phone:{" "}
                <span className="font-medium">{voucher.driverPhone}</span>
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[11px] font-semibold text-slate-800">
                Arfeen Support
              </p>
              <p className="mt-1 text-slate-600">
                For any change or emergency during transfer, contact:
              </p>
              <ul className="mt-1 space-y-1 text-slate-600">
                <li>WhatsApp (24/7): +966 XX XXX XXXX</li>
                <li>Office: +92 XX XXX XXXX</li>
                <li>Email: support@arfeentravel.com</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-[10px] text-slate-500">
              <p className="font-semibold text-slate-700">Terms</p>
              <ul className="mt-1 space-y-1">
                <li>• This voucher is valid only for the mentioned date/time.</li>
                <li>• Any last-minute change is subject to vehicle availability.</li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
