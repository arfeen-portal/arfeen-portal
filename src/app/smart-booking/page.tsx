"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Suggestion = {
  pickup_city: string;
  dropoff_city: string;
  comment: string;
};

function guessRoute(from: string, to: string): Suggestion[] {
  const f = from.toLowerCase();
  const t = to.toLowerCase();

  const suggestions: Suggestion[] = [];

  if (f.includes("jeddah") && t.includes("jeddah")) {
    suggestions.push({
      pickup_city: "Jeddah Airport",
      dropoff_city: "Makkah Hotel",
      comment: "Standard JED → Makkah hotel transfer.",
    });
  }

  if (f.includes("madinah") || t.includes("madinah")) {
    suggestions.push({
      pickup_city: "Madinah Airport",
      dropoff_city: "Madinah Hotel",
      comment: "Madinah airport to hotel transfer.",
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      pickup_city: "Airport",
      dropoff_city: "Hotel",
      comment:
        "Custom route – please choose exact pickup/dropoff cities while confirming.",
    });
  }

  return suggestions;
}

export default function SmartBookingPage() {
  const supabase = createClient();

  const [flightFrom, setFlightFrom] = useState("");
  const [flightTo, setFlightTo] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [passengerName, setPassengerName] = useState("");
  const [ticketFile, setTicketFile] = useState<File | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSuggest = () => {
    const s = guessRoute(flightFrom, flightTo);
    setSuggestions(s);
  };

  const handleCreateBooking = async (s: Suggestion) => {
    setSaving(true);

    await supabase.from("transport_bookings").insert({
      pickup_city: s.pickup_city,
      dropoff_city: s.dropoff_city,
      pickup_time: arrivalTime || null,
      passenger_name: passengerName || null,
      source_type: "SMART_BOOKING",
    });

    setSaving(false);
    alert("Transport booking created from smart suggestion!");
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Smart Booking (Ticket → Transport)</h1>
      <p className="text-gray-600 text-sm">
        Upload ticket + enter basic flight details and get instant transport
        suggestions (airport → hotel).
      </p>

      <div className="p-5 bg-white border rounded shadow space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Ticket Snapshot (optional)
          </label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setTicketFile(e.target.files?.[0] || null)}
          />
          {ticketFile && (
            <p className="text-xs text-gray-500 mt-1">
              Selected: {ticketFile.name}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Flight From (City / Airport)
            </label>
            <input
              className="border p-2 rounded w-full"
              value={flightFrom}
              onChange={(e) => setFlightFrom(e.target.value)}
              placeholder="e.g. Karachi, Dubai, Jeddah"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Flight To (City / Airport)
            </label>
            <input
              className="border p-2 rounded w-full"
              value={flightTo}
              onChange={(e) => setFlightTo(e.target.value)}
              placeholder="e.g. Jeddah, Madinah"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Arrival Date & Time
            </label>
            <input
              type="datetime-local"
              className="border p-2 rounded w-full"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Passenger Name
            </label>
            <input
              className="border p-2 rounded w-full"
              value={passengerName}
              onChange={(e) => setPassengerName(e.target.value)}
              placeholder="e.g. Muhammad Ali"
            />
          </div>
        </div>

        <button
          onClick={handleSuggest}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Get Transport Suggestions
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold">Suggested Routes</h2>

          {suggestions.map((s, idx) => (
            <div
              key={idx}
              className="p-4 bg-white border rounded shadow flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">
                  {s.pickup_city} → {s.dropoff_city}
                </p>
                <p className="text-xs text-gray-600 mt-1">{s.comment}</p>
              </div>

              <button
                disabled={saving}
                onClick={() => handleCreateBooking(s)}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded"
              >
                {saving ? "Saving..." : "Create Booking"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
