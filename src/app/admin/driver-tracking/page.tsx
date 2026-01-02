// arfeen-portal/src/app/admin/driver-tracking/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabaseClient";
export const dynamic = "force-dynamic";
type DriverLocation = {
  driver_id: string;
  lat: number;
  lng: number;
  updated_at: string;
};

export default function DriverTrackingPage() {
  const [locations, setLocations] = useState<DriverLocation[]>([]);

  useEffect(() => {
    const fetchInitial = async () => {
      const { data, error } = await supabase
        .from('driver_locations')
        .select('driver_id, lat, lng, updated_at');

      if (!error && data) {
        setLocations(data as DriverLocation[]);
      }
    };

    fetchInitial();

    const channel = supabase
      .channel('driver-locations-admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'driver_locations' },
        (payload) => {
          const newRow = payload.new as DriverLocation | null;
          const oldRow = payload.old as DriverLocation | null;

          setLocations((current) => {
            const copy = [...current];

            if (payload.eventType === 'INSERT' && newRow) {
              const idx = copy.findIndex((l) => l.driver_id === newRow.driver_id);
              if (idx >= 0) copy[idx] = newRow;
              else copy.push(newRow);
              return copy;
            }

            if (payload.eventType === 'UPDATE' && newRow) {
              const idx = copy.findIndex((l) => l.driver_id === newRow.driver_id);
              if (idx >= 0) copy[idx] = newRow;
              else copy.push(newRow);
              return copy;
            }

            if (payload.eventType === 'DELETE' && oldRow) {
              return copy.filter((l) => l.driver_id !== oldRow.driver_id);
            }

            return copy;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold mb-2">Driver Live Locations</h1>

      {/* Yahan map component bind karna hai */}
      <pre className="bg-slate-900 text-slate-100 text-xs p-4 rounded">
        {JSON.stringify(locations, null, 2)}
      </pre>
    </div>
  );
}
