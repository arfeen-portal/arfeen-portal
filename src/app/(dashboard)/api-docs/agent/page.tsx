'use client';

import React from 'react';

const baseUrl =
  typeof window === 'undefined' ? '' : window.location.origin || '';

export default function AgentApiDocsPage() {
  const url = baseUrl || 'https://your-domain.com';

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold">Agent API – v1</h1>
        <p className="text-sm text-muted-foreground">
          Secure JSON API for partner agents. All requests must include
          <code className="bg-gray-100 px-1 py-0.5 rounded mx-1">
            x-api-key
          </code>
          header.
        </p>
      </div>

      <section className="space-y-2 text-sm">
        <h2 className="font-semibold text-base">Authentication</h2>
        <p>
          Header:
          <code className="bg-gray-100 px-2 py-1 rounded ml-2">
            x-api-key: YOUR_AGENT_API_KEY
          </code>
        </p>
      </section>

      <Endpoint
        method="GET"
        path="/api/agent/v1/routes"
        description="List available routes."
        example={`curl -X GET "${url}/api/agent/v1/routes" \\
  -H "x-api-key: YOUR_API_KEY"`}
      />

      <Endpoint
        method="POST"
        path="/api/agent/v1/rate"
        description="Get price quote for a transport sector."
        example={`curl -X POST "${url}/api/agent/v1/rate" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "vehicle_id": "UUID",
    "from_city_id": "UUID",
    "to_city_id": "UUID",
    "travel_date": "2025-01-10",
    "pax": 4
  }'`}
      />

      <Endpoint
        method="POST"
        path="/api/agent/v1/bookings"
        description="Create a new transport booking."
        example={`curl -X POST "${url}/api/agent/v1/bookings" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "route_id": "UUID",
    "vehicle_id": "UUID",
    "travel_date": "2025-01-10",
    "pax": 4,
    "customer_name": "John Doe"
  }'`}
      />
    </div>
  );
}

function Endpoint({
  method,
  path,
  description,
  example,
}: {
  method: string;
  path: string;
  description: string;
  example: string;
}) {
  return (
    <div className="border rounded-xl bg-white shadow-sm p-4 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-black text-white">
            {method}
          </span>
          <code>{path}</code>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <pre className="bg-gray-900 text-gray-100 text-xs rounded-lg p-3 overflow-x-auto">
        {example}
      </pre>
    </div>
  );
}
