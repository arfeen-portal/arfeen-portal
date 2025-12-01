"use client";

import { useState } from "react";

export default function AgentNewTransportBookingPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/transport/bookings", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Error creating booking");
      } else {
        window.location.href = `/agent/transport/${json.id}`;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="text-xl font-bold mb-2">New Transport Booking</h1>

      <form
        action={handleSubmit}
        className="card space-y-3"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Pickup City</label>
            <input
              name="pickup_city"
              className="w-full border rounded px-2 py-1 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Dropoff City</label>
            <input
              name="dropoff_city"
              className="w-full border rounded px-2 py-1 text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500">Pickup Date & Time</label>
          <input
            type="datetime-local"
            name="pickup_time"
            className="w-full border rounded px-2 py-1 text-sm"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Vehicle Type</label>
            <select
              name="vehicle_type"
              className="w-full border rounded px-2 py-1 text-sm"
            >
              <option value="GMC">GMC</option>
              <option value="H1">H1</option>
              <option value="Hiace">Hiace</option>
              <option value="Coaster">Coaster</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Passenger Name</label>
            <input
              name="passenger_name"
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500">
            Notes (Flight, hotel, etc.)
          </label>
          <textarea
            name="notes"
            className="w-full border rounded px-2 py-1 text-sm"
            rows={2}
          />
        </div>

        <button
          disabled={loading}
          className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create Booking"}
        </button>
      </form>
    </div>
  );
}
