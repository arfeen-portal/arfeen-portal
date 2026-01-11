// src/app/admin/vouchers/package/[packageBookingId]/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;
type PageProps = {
  params: { packageBookingId: string };
};

export default function PackageVoucherPage({ params }: PageProps) {
  const bookingRef = params.packageBookingId;

  const voucher = {
    bookingReference: bookingRef,
    passengerName: "Syed Family Group",
    passengers: 4,
    packageName: "20N Umrah – 12N Makkah + 8N Madinah",
    travelDates: "10 Jan 2026 – 30 Jan 2026",
    makkahHotel: "Swissotel Makkah (BB)",
    madinahHotel: "Rua Al Hijrah (BB)",
    flightDetails: "LHE → JED / MED → LHE (Economy)",
    totalPrice: "38,000 SAR",
    perPersonPrice: "9,500 SAR",
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
              Umrah Package Voucher
            </h1>
            <p className="text-[11px] text-slate-500">
              Package confirmation for passenger & embassy file.
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-500">
            <p>Booking Ref</p>
            <p className="font-mono text-xs font-semibold text-slate-900">
              {voucher.bookingReference}
            </p>
          </div>
        </header>

        {/* Body */}
        <section className="mt-4 space-y-3 text-[11px]">
          {/* Passenger / Package */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[11px] font-semibold text-slate-800">
                Passenger Details
              </p>
              <p className="mt-1 text-slate-600">
                Lead passenger / group:{" "}
                <span className="font-medium">
                  {voucher.passengerName}
                </span>
              </p>
              <p className="text-slate-600">
                Total passengers:{" "}
                <span className="font-medium">{voucher.passengers}</span>
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[11px] font-semibold text-slate-800">
                Package Details
              </p>
              <p className="mt-1 font-medium text-slate-900">
                {voucher.packageName}
              </p>
              <p className="text-slate-600">
                Travel dates:{" "}
                <span className="font-medium">
                  {voucher.travelDates}
                </span>
              </p>
            </div>
          </div>

          {/* Hotels */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[11px] font-semibold text-slate-800">
                Makkah Hotel
              </p>
              <p className="mt-1 text-slate-700">{voucher.makkahHotel}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[11px] font-semibold text-slate-800">
                Madinah Hotel
              </p>
              <p className="mt-1 text-slate-700">{voucher.madinahHotel}</p>
            </div>
          </div>

          {/* Flights & Price */}
          <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[11px] font-semibold text-slate-800">
                Flight Details
              </p>
              <p className="mt-1 text-slate-700">{voucher.flightDetails}</p>
              <ul className="mt-1 space-y-1 text-slate-500">
                <li>• Airline to be confirmed at ticketing stage.</li>
                <li>• Flight timings may differ slightly as per final issue.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[11px] font-semibold text-slate-800">
                Price Summary
              </p>
              <p className="mt-1 text-slate-600">
                Total package:{" "}
                <span className="font-semibold text-slate-900">
                  {voucher.totalPrice}
                </span>
              </p>
              <p className="text-slate-600">
                Per person:{" "}
                <span className="font-semibold text-slate-900">
                  {voucher.perPersonPrice}
                </span>
              </p>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-[10px] text-slate-500">
            <p className="font-semibold text-slate-700">Inclusions</p>
            <ul className="mt-1 space-y-1">
              <li>• Hotel accommodation as per above.</li>
              <li>• Return flights in economy class.</li>
              <li>• Umrah visa for eligible nationalities.</li>
              <li>• Private transport between airport, Makkah & Madinah.</li>
            </ul>

            <p className="mt-2 font-semibold text-slate-700">Exclusions</p>
            <ul className="mt-1 space-y-1">
              <li>• PCR tests (if required by regulations).</li>
              <li>• Lunch/dinner meals & personal expenses.</li>
            </ul>

            <p className="mt-2">
              This voucher is issued by <b>Arfeen Travel</b> as confirmation of
              booking details. For any changes or queries, please contact our
              support.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
