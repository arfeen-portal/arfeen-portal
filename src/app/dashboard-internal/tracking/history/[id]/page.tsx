"use client";

import { useEffect, useState } from "react";

type LocationPoint = {
  lat: number;
  lng: number;
  created_at: string;
};

type PageProps = {
  params: { id: string };
};

export default function TrackingHistoryPage({ params }: PageProps) {
  const bookingId = params.id;
  const [items, setItems] = useState<LocationPoint[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/tracking/booking/${bookingId}`);
      const json = await res.json();
      setItems(json.data || []);
    };
    load();
  }, [bookingId]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Location History</h1>

      <div className="bg-white p-4 rounded-xl shadow border">
        {items.length === 0 && (
          <p className="text-sm text-gray-400">No history yet.</p>
        )}

        <ul className="space-y-3">
          {items.map((h, idx) => (
            <li
              key={idx}
              className="border-l-4 pl-3 border-blue-600 bg-gray-50 p-2 rounded"
            >
              <p className="font-semibold text-sm">
                {new Date(h.created_at).toLocaleString()}
              </p>
              <p className="text-xs text-gray-600">
                Lat: {h.lat} — Lng: {h.lng}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
