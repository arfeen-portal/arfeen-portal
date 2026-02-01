'use client';

import React, { useEffect, useState, useMemo } from 'react';

type ApiDriverItem = {
  driver_id: string;
  booking_id: string | null;
  lat: number;
  lng: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  last_ping_at: string;
  drivers?: {
    full_name: string | null;
    phone: string | null;
  } | null;
  transport_bookings?: {
    booking_code: string | null;
    from_city_name: string | null;
    to_city_name: string | null;
    status: string | null;
  } | null;
};

export default function DriverTrackingPage() {
  const [items, setItems] = useState<ApiDriverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'on_trip' | 'idle'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/dashboard/driver-latest');
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || 'Failed to load');
        }

        setItems(json.items || []);
        setError(null);
      } catch (e: any) {
        console.error(e);
        setError(e.message || 'Error loading data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // simple polling: refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const name = item.drivers?.full_name?.toLowerCase() || '';
      const phone = item.drivers?.phone || '';
      const bookingCode = item.transport_bookings?.booking_code || '';

      const matchesSearch =
        !search ||
        name.includes(search.toLowerCase()) ||
        phone.includes(search) ||
        bookingCode.toLowerCase().includes(search.toLowerCase());

      let matchesStatus = true;
      if (statusFilter === 'on_trip') {
        matchesStatus = (item.transport_bookings?.status || '').toLowerCase() === 'in_progress';
      } else if (statusFilter === 'idle') {
        matchesStatus = !item.booking_id;
      }

      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Driver Tracking</h1>
          <p className="text-sm text-muted-foreground">
            Live latest location for every driver + current booking status.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="border rounded-md px-3 py-2 text-sm min-w-[220px]"
            placeholder="Search driver / phone / booking"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="border rounded-md px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All drivers</option>
            <option value="on_trip">On trip</option>
            <option value="idle">Idle / no booking</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total drivers"
          value={items.length}
          hint="All drivers with at least one ping"
        />
        <StatCard
          label="On trip"
          value={items.filter((i) => i.booking_id).length}
          hint="Currently attached to a booking"
        />
        <StatCard
          label="Idle"
          value={items.filter((i) => !i.booking_id).length}
          hint="No active booking"
        />
      </div>

      <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-sm">Live driver list</h2>
          <span className="text-xs text-muted-foreground">
            Auto-refresh every 30 seconds
          </span>
        </div>

        {loading ? (
          <div className="p-4 text-sm">Loading...</div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">Error: {error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">No drivers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <Th>Driver</Th>
                  <Th>Phone</Th>
                  <Th>Booking</Th>
                  <Th>Route</Th>
                  <Th>Status</Th>
                  <Th>Lat / Lng</Th>
                  <Th>Last ping</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.driver_id} className="border-t">
                    <Td>{item.drivers?.full_name || '—'}</Td>
                    <Td>{item.drivers?.phone || '—'}</Td>
                    <Td>{item.transport_bookings?.booking_code || item.booking_id || '—'}</Td>
                    <Td>
                      {item.transport_bookings?.from_city_name && item.transport_bookings?.to_city_name
                        ? `${item.transport_bookings.from_city_name} → ${item.transport_bookings.to_city_name}`
                        : '—'}
                    </Td>
                    <Td>
                      {item.transport_bookings?.status
                        ? item.transport_bookings.status
                        : item.booking_id
                        ? 'On trip'
                        : 'Idle'}
                    </Td>
                    <Td>
                      {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                    </Td>
                    <Td>
                      {new Date(item.last_ping_at).toLocaleString(undefined, {
                        hour12: false,
                      })}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Future: Link to full map view */}
      <div className="text-xs text-muted-foreground">
        Tip: Yahan se baad mein “View on map” button add kar sakte hain jo existing locator map page
        open karega.
      </div>
    </div>
  );
}

function StatCard(props: { label: string; value: number; hint?: string }) {
  return (
    <div className="border rounded-xl bg-white px-4 py-3 shadow-sm">
      <div className="text-xs text-muted-foreground">{props.label}</div>
      <div className="text-2xl font-semibold mt-1">{props.value}</div>
      {props.hint && (
        <div className="text-[11px] text-muted-foreground mt-1">{props.hint}</div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 whitespace-nowrap text-xs">{children}</td>;
}
