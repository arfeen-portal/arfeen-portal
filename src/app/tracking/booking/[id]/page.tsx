"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const LiveMap = dynamic(() => import("@/components/map/LiveMap"), {
  ssr: false,
});

type LocationPoint = {
  lat: number;
  lng: number;
  created_at: string;
};

type Props = {
  params: { id: string };
};

export default function BookingTrackingPage({ params }: Props) {
  const bookingId = params.id;
  const [points, setPoints] = useState<LocationPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch(`/api/tracking/booking/${bookingId}`);
        const json = await res.json();
        setPoints(json.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
    const interval = setInterval(fetchLocations, 15000); // 15 sec
    return () => clearInterval(interval);
  }, [bookingId]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="p-4 bg-white shadow flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="font-bold text-lg">Arfeen Travel – Live Tracking</h1>
            <p className="text-xs text-gray-500">
              Booking ID: {bookingId.slice(0, 8)}...
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="bg-white rounded-xl shadow border overflow-hidden h-[70vh]">
          <LiveMap points={points} />
        </div>

        <div className="mt-3 text-xs text-gray-500 text-center">
          Location updates every 15 seconds. Internet connection required.
        </div>
      </main>
    </div>
  );
}
