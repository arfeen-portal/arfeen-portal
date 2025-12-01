import PageHeader from "@/components/layout/PageHeader";

export default function ApiDocsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Public API Documentation"
        subtitle="Use these endpoints to search routes and build your own front-end."
      />

      {/* Intro */}
      <section className="p-4 md:p-5 bg-white border rounded-lg shadow-sm space-y-2">
        <p className="text-sm text-slate-600">
          All endpoints are read-only for now and require a valid{" "}
          <span className="font-mono text-xs bg-slate-100 px-1 rounded">
            api_key
          </span>{" "}
          query parameter.
        </p>
        <p className="text-xs text-slate-500">
          Base URL example:{" "}
          <span className="font-mono">
            https://your-portal-domain.com/api/public
          </span>
        </p>
      </section>

      {/* Authentication */}
      <section className="p-4 md:p-5 bg-white border rounded-lg shadow-sm space-y-3">
        <h2 className="font-semibold text-sm">Authentication</h2>
        <p className="text-sm text-slate-600">
          Each partner/agent gets one or more API keys. Contact Arfeen Travel
          team to generate or rotate your key. Include the key in every request
          as a query parameter:
        </p>
        <pre className="bg-slate-950 text-slate-100 text-xs p-3 rounded-md overflow-x-auto">
{`GET /api/public/transport?api_key=YOUR_KEY&pickup=Makkah&dropoff=Madinah`}
        </pre>
      </section>

      {/* Transport Search */}
      <section className="p-4 md:p-5 bg-white border rounded-lg shadow-sm space-y-4">
        <h2 className="font-semibold text-sm">
          GET /api/public/transport – Search available routes
        </h2>

        <div className="space-y-1 text-xs text-slate-600">
          <p>
            <span className="font-semibold">Method:</span> GET
          </p>
          <p>
            <span className="font-semibold">URL:</span>{" "}
            <span className="font-mono">
              /api/public/transport?api_key=...&pickup=...&dropoff=...
            </span>
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-700">Query params</p>
          <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
            <li>
              <span className="font-mono">api_key</span> – required, your
              assigned API key
            </li>
            <li>
              <span className="font-mono">pickup</span> – optional, pickup city
              (e.g. &quot;Jeddah&quot;, &quot;Makkah&quot;)
            </li>
            <li>
              <span className="font-mono">dropoff</span> – optional, dropoff
              city
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-700">Example request</p>
          <pre className="bg-slate-950 text-slate-100 text-xs p-3 rounded-md overflow-x-auto">
{`GET https://your-portal-domain.com/api/public/transport?api_key=123456&pickup=Makkah&dropoff=Madinah`}
          </pre>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-700">
            Example JSON response
          </p>
          <pre className="bg-slate-950 text-slate-100 text-xs p-3 rounded-md overflow-x-auto">
{`{
  "agent_id": "abc-agent-id",
  "results": [
    {
      "id": "route-1",
      "pickup_city": "Makkah",
      "dropoff_city": "Madinah",
      "vehicle_type": "GMC",
      "base_price": 550
    }
  ]
}`}
          </pre>
        </div>
      </section>

      {/* Future endpoints placeholder */}
      <section className="p-4 md:p-5 bg-white border rounded-lg shadow-sm space-y-2">
        <h2 className="font-semibold text-sm">Upcoming endpoints</h2>
        <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
          <li>POST /api/public/bookings – create transport booking</li>
          <li>GET /api/public/bookings/{`{reference}`}</li>
          <li>GET /api/public/hotels – hotel search</li>
        </ul>
        <p className="text-xs text-slate-500">
          These will be documented here once enabled for partners.
        </p>
      </section>
    </div>
  );
}
