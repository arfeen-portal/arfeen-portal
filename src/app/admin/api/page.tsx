export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-5">
        {/* Header */}
        <header>
          <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
            Developers
          </p>
          <h1 className="text-xl font-semibold text-slate-900">
            Arfeen Travel API
          </h1>
          <p className="text-xs text-slate-500">
            High-level documentation for partners who want to integrate transport, Umrah
            packages & hotel inventory via API.
          </p>
        </header>

        {/* Intro + Base URL */}
        <section className="grid gap-4 md:grid-cols-[2fr_1.2fr]">
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm text-[11px] text-slate-800">
            <p className="text-xs font-semibold text-slate-900">
              Overview
            </p>
            <p className="mt-2">
              Arfeen Travel API allows trusted partners to search transport routes, check
              Umrah package availability, and create bookings directly from their own
              systems, websites or apps.
            </p>
            <p className="mt-2">
              This page is a <b>draft documentation UI</b>. Later, you can plug real
              endpoints and auto-generated docs here.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm text-[11px] text-slate-800">
            <p className="text-xs font-semibold text-slate-900">
              Base URL
            </p>
            <p className="mt-2 text-[10px] font-mono text-slate-700">
              https://api.arfeentravel.com/v1
            </p>
            <p className="mt-2 text-slate-600">
              All endpoints listed below will be relative to this base URL.
            </p>
          </div>
        </section>

        {/* Auth */}
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm text-[11px] text-slate-800">
          <p className="text-xs font-semibold text-slate-900">
            Authentication
          </p>
          <p className="mt-2">
            Every request must include a valid API key in the{" "}
            <span className="font-mono">Authorization</span> header. In future, you can
            generate and revoke keys for each agent from this admin panel.
          </p>

          <pre className="mt-3 rounded-xl bg-slate-900 px-3 py-2 text-[10px] text-slate-100">
{`GET /v1/transport/search
Authorization: Bearer YOUR_API_KEY_HERE`}
          </pre>

          <p className="mt-2 text-slate-600">
            For security, never share your API key publicly or embed it directly on
            front-end websites.
          </p>
        </section>

        {/* Endpoints list */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Core endpoints</h2>

          {/* Transport Search */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm text-[11px] text-slate-800">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-slate-900">
                GET /transport/search
              </p>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                Transport
              </span>
            </div>
            <p className="mt-1 text-slate-600">
              Returns available vehicles & pricing for a given pickup / dropoff route.
            </p>

            <div className="mt-2 grid gap-3 md:grid-cols-2">
              <div>
                <p className="font-semibold text-slate-900">Query params</p>
                <ul className="mt-1 space-y-1">
                  <li>
                    <b>pickup_city</b> – e.g. <code>Jeddah</code>
                  </li>
                  <li>
                    <b>dropoff_city</b> – e.g. <code>Makkah</code>
                  </li>
                  <li>
                    <b>date</b> – YYYY-MM-DD
                  </li>
                  <li>
                    <b>vehicle_type</b> (optional) – GMC / H1 / Coaster / Hiace
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Example</p>
                <pre className="mt-1 rounded-xl bg-slate-900 px-3 py-2 text-[10px] text-slate-100">
{`GET /v1/transport/search?pickup_city=Jeddah&dropoff_city=Makkah&date=2025-12-01

Response:
{
  "routes": [
    {
      "vehicle_type": "GMC",
      "price": 350,
      "currency": "SAR",
      "eta_minutes": 90
    }
  ]
}`}
                </pre>
              </div>
            </div>
          </div>

          {/* Umrah Packages */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm text-[11px] text-slate-800">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-slate-900">
                GET /umrah/packages
              </p>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                Umrah
              </span>
            </div>
            <p className="mt-1 text-slate-600">
              Returns available Umrah packages for a given date range & occupancy.
            </p>

            <div className="mt-2 grid gap-3 md:grid-cols-2">
              <div>
                <p className="font-semibold text-slate-900">Query params</p>
                <ul className="mt-1 space-y-1">
                  <li>
                    <b>check_in</b> – start date
                  </li>
                  <li>
                    <b>nights_makkah</b>, <b>nights_madinah</b>
                  </li>
                  <li>
                    <b>pax</b> – total passengers
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Example</p>
                <pre className="mt-1 rounded-xl bg-slate-900 px-3 py-2 text-[10px] text-slate-100">
{`GET /v1/umrah/packages?check_in=2026-01-10&nights_makkah=12&nights_madinah=8&pax=4

Response:
{
  "packages": [
    {
      "code": "20N-PREM-12-8",
      "makkah_hotel": "Swissotel Makkah",
      "madinah_hotel": "Rua Al Hijrah",
      "price_per_person": 9500,
      "currency": "SAR"
    }
  ]
}`}
                </pre>
              </div>
            </div>
          </div>

          {/* Booking create */}
          <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm text-[11px] text-slate-800">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-slate-900">
                POST /bookings
              </p>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                Booking
              </span>
            </div>
            <p className="mt-1 text-slate-600">
              Create a new booking (transport or Umrah package) using selected options.
            </p>

            <div className="mt-2 grid gap-3 md:grid-cols-2">
              <div>
                <p className="font-semibold text-slate-900">Request body</p>
                <pre className="mt-1 rounded-xl bg-slate-900 px-3 py-2 text-[10px] text-slate-100">
{`{
  "type": "transport",
  "agent_reference": "YOUR-SYSTEM-REF",
  "product_code": "TR-JED-MAK-GMC",
  "passengers": 5,
  "date": "2025-12-01",
  "time": "10:30",
  "lead_passenger": {
    "name": "Syed Muhammad",
    "phone": "+92..."
  }
}`}
                </pre>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Response (example)</p>
                <pre className="mt-1 rounded-xl bg-slate-900 px-3 py-2 text-[10px] text-slate-100">
{`{
  "booking_ref": "TR-2025-045",
  "status": "confirmed",
  "voucher_url": "https://portal.arfeentravel.com/admin/vouchers/transport/TR-2025-045"
}`}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Notes */}
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm text-[11px] text-slate-700">
          <p className="text-xs font-semibold text-slate-900">
            Next steps
          </p>
          <ul className="mt-2 space-y-1">
            <li>• Add real endpoints in your backend under /api.</li>
            <li>• Plug live examples & schemas into this page.</li>
            <li>• Add API key management (create / revoke per agent).</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
