export default function ApiDocsPage() {
  return (
    <main className="p-6">
      <h1 className="text-lg font-semibold mb-4">Arfeen Travel API</h1>
      <p className="text-xs mb-4 text-gray-600">
        Use this API to search availability, create bookings and fetch status.
        Each agent gets a unique API key.
      </p>

      <div className="space-y-4 text-xs">
        <section className="border rounded-xl p-3 bg-white">
          <h2 className="font-semibold mb-1">Authentication</h2>
          <pre className="bg-gray-100 rounded p-2 text-[11px] overflow-x-auto">
{`GET https://your-domain.com/api/v1/bookings
Authorization: Bearer YOUR_API_KEY`}
          </pre>
        </section>

        <section className="border rounded-xl p-3 bg-white">
          <h2 className="font-semibold mb-1">Create Booking</h2>
          <pre className="bg-gray-100 rounded p-2 text-[11px] overflow-x-auto">
{`POST /api/v1/bookings
{
  "agent_reference": "YOUR-REF",
  "pickup_city": "Jeddah",
  "dropoff_city": "Makkah",
  "date": "2025-01-01",
  "vehicle_type": "GMC"
}`}
          </pre>
        </section>
      </div>
    </main>
  );
}
