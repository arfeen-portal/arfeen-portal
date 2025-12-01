export default function PortalLandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="px-8 py-4 flex items-center justify-between bg-white border-b">
        <div className="flex items-center gap-3">
          <img src="/logo.png" className="w-10 h-10 object-contain" />
          <div>
            <p className="font-bold text-lg">Arfeen Travel Portal</p>
            <p className="text-xs text-gray-500">
              Built for Umrah & Transport Agents
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="max-w-3xl text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold">
            Run your Umrah & Transport business
            <br />
            on one premium portal.
          </h1>
          <p className="text-gray-600">
            Live tracking, B2B agent bookings, driver app, and CA-style
            accounting – all in one Arfeen Travel platform.
          </p>

          <div className="flex flex-wrap gap-3 justify-center mt-4">
            <a
              href="/demo"
              className="px-6 py-3 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              View Live Demo
            </a>
            <a
              href="https://wa.me/YourNumberHere"
              className="px-6 py-3 rounded-lg border text-sm font-medium hover:bg-gray-50"
            >
              Talk to Our Team
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 text-left">
            <div className="card">
              <p className="font-semibold text-sm mb-1">
                Live Driver & Family Tracking
              </p>
              <p className="text-xs text-gray-500">
                Airport se hotel tak har movement map pe – agents & families
                dono ke liye peace of mind.
              </p>
            </div>
            <div className="card">
              <p className="font-semibold text-sm mb-1">
                B2B Agent Booking Portal
              </p>
              <p className="text-xs text-gray-500">
                Aap ke sub-agents apne login se transport bookings bana sakte
                hain, ledger auto update hota hai.
              </p>
            </div>
            <div className="card">
              <p className="font-semibold text-sm mb-1">
                Full Accounts & Ledger
              </p>
              <p className="text-xs text-gray-500">
                Journal, trial balance, aging – sab CA style, lekin travel
                business ke hisaab se designed.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
