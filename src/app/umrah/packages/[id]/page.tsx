// src/app/umrah/packages/[id]/page.tsx

// NOTE: Agar aapke paas already server-side data fetch ho raha hai,
// to wahan se "pkg" object bana kar is UI ke andar inject kar sakte hain.
// Abhi dummy data use ho raha hai.
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function PackageDetailPage() {
  // Dummy data – baad mein DB se replace karna asaan rahega
  const pkg = {
    name: "Premium 12N Makkah + 8N Madinah",
    code: "AT-UMR-12-8-PREMIUM",
    nightsMakkah: 12,
    nightsMadinah: 8,
    totalNights: 20,
    startingFrom: "8,950 SAR",
    perPerson: "Twin Sharing",
    makkahHotel: {
      name: "Swissotel Makkah",
      distance: "100m from Haram",
      board: "BB",
      room: "Partial Haram View",
    },
    madinahHotel: {
      name: "Rua Al Hijrah",
      distance: "150m from Masjid Nabawi",
      board: "BB",
      room: "Standard Room",
    },
    flights: "Return ticket – Economy – Jeddah in / Madinah out",
    visaIncluded: true,
    transportIncluded: true,
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span>Umrah Packages</span>
          <span>/</span>
          <span className="text-slate-700">Package Detail</span>
          <span>/</span>
          <span className="font-medium text-slate-900">{pkg.code}</span>
        </div>

        {/* Header */}
        <section className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm md:flex-row md:items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
              Arfeen Travel · Umrah
            </p>
            <h1 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight text-slate-900">
              {pkg.name}
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              {pkg.nightsMakkah} nights Makkah · {pkg.nightsMadinah} nights
              Madinah · Total {pkg.totalNights} nights
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              Package code: <span className="font-mono">{pkg.code}</span>
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 text-right">
            <div>
              <p className="text-[11px] uppercase tracking-[0.15em] text-slate-400">
                Starting from
              </p>
              <p className="text-xl font-semibold text-emerald-600">
                {pkg.startingFrom}
              </p>
              <p className="text-[11px] text-slate-500">
                per person – {pkg.perPerson}
              </p>
            </div>

            <button className="rounded-xl bg-gradient-to-r from-[#0C3C78] to-[#C9A045] px-4 py-2 text-xs font-semibold text-white shadow hover:brightness-110">
              Create booking for this package
            </button>
          </div>
        </section>

        {/* Main content */}
        <section className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
          {/* Left: Hotels + flights + inclusions */}
          <div className="space-y-4">
            {/* Hotels */}
            <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">
                Hotels Overview
              </h2>
              <p className="text-[11px] text-slate-500">
                Both hotels selected to keep you near Haram & Masjid Nabawi.
              </p>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {/* Makkah Card */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Makkah · {pkg.nightsMakkah} nights
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {pkg.makkahHotel.name}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    {pkg.makkahHotel.distance}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    Board:{" "}
                    <span className="font-medium">{pkg.makkahHotel.board}</span>
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    Room type:{" "}
                    <span className="font-medium">{pkg.makkahHotel.room}</span>
                  </p>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Early check-in / late checkout subject to availability.
                  </p>
                </div>

                {/* Madinah Card */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Madinah · {pkg.nightsMadinah} nights
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {pkg.madinahHotel.name}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    {pkg.madinahHotel.distance}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    Board:{" "}
                    <span className="font-medium">
                      {pkg.madinahHotel.board}
                    </span>
                  </p>
                  <p className="mt-1 text-[11px] text-slate-600">
                    Room type:{" "}
                    <span className="font-medium">
                      {pkg.madinahHotel.room}
                    </span>
                  </p>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Rooms allocated close to lift & Masjid side when possible.
                  </p>
                </div>
              </div>
            </div>

            {/* Flights & Transport */}
            <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">
                Flights & Transport
              </h2>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50/80 p-3 text-[11px] text-slate-700">
                  <p className="font-semibold text-slate-900">Flights</p>
                  <p className="mt-1">{pkg.flights}</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Airlines: SV / FZ / G9 / other options on request</li>
                    <li>• Route can be customised on group request</li>
                    <li>• Fare is subject to availability at time of booking</li>
                  </ul>
                </div>

                <div className="rounded-2xl bg-slate-50/80 p-3 text-[11px] text-slate-700">
                  <p className="font-semibold text-slate-900">Transport</p>
                  <ul className="mt-1 space-y-1">
                    <li>• Jeddah Airport ↔ Makkah (arrival & departure)</li>
                    <li>• Makkah ↔ Madinah (Haramain routes)</li>
                    <li>• Vehicles: GMC / H1 / Coaster (as per group size)</li>
                    <li>• Private, non-sharing, door-to-door service</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Inclusions / Exclusions */}
            <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">
                Inclusions & Exclusions
              </h2>

              <div className="mt-3 grid gap-4 md:grid-cols-2 text-[11px]">
                <div>
                  <p className="font-semibold text-emerald-700">Included</p>
                  <ul className="mt-1 space-y-1 text-slate-700">
                    <li>• Hotel accommodation as per details above</li>
                    <li>• Daily breakfast (where mentioned)</li>
                    <li>• Return flights (economy class)</li>
                    <li>• Umrah visa (for eligible nationalities)</li>
                    <li>• Private transport for mentioned routes</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-rose-700">Not Included</p>
                  <ul className="mt-1 space-y-1 text-slate-700">
                    <li>• PCR / medical test charges (if any)</li>
                    <li>• Lunch & dinner meals</li>
                    <li>• Personal expenses, laundry, shopping etc.</li>
                    <li>• Extra nights or room category upgrade</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Price Breakdown & Actions */}
          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900">
                Price Breakdown (Sample)
              </h2>
              <p className="text-[11px] text-slate-500">
                Ye sirf structure ke liye hai – aapka original -5 SAR / +profit
                formula backend se apply hoga.
              </p>

              <div className="mt-3 space-y-2 text-[11px] text-slate-700">
                <div className="flex items-center justify-between">
                  <span>Hotel cost (20 nights)</span>
                  <span>5,400 SAR</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Flight cost</span>
                  <span>2,000 SAR</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Visa</span>
                  <span>500 SAR</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Transport</span>
                  <span>700 SAR</span>
                </div>
                <hr className="my-2 border-dashed border-slate-200" />
                <div className="flex items-center justify-between font-semibold text-slate-900">
                  <span>Total base cost</span>
                  <span>8,600 SAR</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>+ Arfeen margin</span>
                  <span>350 SAR</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>→ Final selling price</span>
                  <span className="font-semibold text-emerald-600">
                    8,950 SAR
                  </span>
                </div>
              </div>

              <button className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black">
                Create booking with this breakdown
              </button>
              <button className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100">
                Export package as PDF
              </button>
            </div>

            <div className="rounded-3xl border border-slate-100 bg-slate-900 p-4 text-[11px] text-slate-100">
              <p className="text-[11px] font-semibold tracking-[0.15em] text-slate-300 uppercase">
                Arfeen support
              </p>
              <p className="mt-1 text-xs font-medium">
                Need to customise this package?
              </p>
              <p className="mt-1 text-[11px] text-slate-300">
                Change hotel, nights, flights or transport type – you can
                duplicate and edit this package from admin anytime.
              </p>
              <ul className="mt-2 space-y-1">
                <li>• Change nights for Makkah / Madinah</li>
                <li>• Switch to 4★ / 5★ hotels</li>
                <li>• Upgrade flight to business class</li>
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
