"use client";

import { useEffect, useState } from "react";

type Booking = {
  id: string;
  pickup_city: string;
  pickup_location: string;
  dropoff_city: string;
  dropoff_location: string;
  pickup_time: string;
  vehicle_type: string;
  passengers: number;
  status: string;
  total_price: number | null;
  customer_name: string | null;
  agent_name: string | null;
};

export default function TransportListPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | Booking["status"]>("all");

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function fetchBookings() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      const res = await fetch("/api/transport/list?" + params.toString());
      const data = await res.json();
      setBookings(data.bookings ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch("/api/transport/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: id, status }),
      });
      if (!res.ok) return;
      await fetchBookings();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap justify-between gap-3 items-center">
        <h1 className="text-2xl font-semibold">Transport Bookings</h1>
        <div className="flex gap-2 items-center">
          <select
            className="border rounded-md px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-3 py-2">Pickup</th>
              <th className="px-3 py-2">Dropoff</th>
              <th className="px-3 py-2">Time</th>
              <th className="px-3 py-2">Vehicle</th>
              <th className="px-3 py-2">Pax</th>
              <th className="px-3 py-2">Customer / Agent</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} className="px-3 py-4 text-center">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && bookings.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-4 text-center">
                  No bookings found.
                </td>
              </tr>
            )}

            {!loading &&
              bookings.map((b) => (
                <tr key={b.id} className="border-t">
                  <td className="px-3 py-2">
                    <div className="font-medium">
                      {b.pickup_city} – {b.pickup_location}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium">
                      {b.dropoff_city} – {b.dropoff_location}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {new Date(b.pickup_time).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">{b.vehicle_type}</td>
                  <td className="px-3 py-2">{b.passengers}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{b.customer_name}</div>
                    <div className="text-xs text-gray-600">
                      {b.agent_name || "-"}
                    </div>
                  </td>
                  <td className="px-3 py-2">{b.status}</td>
                  <td className="px-3 py-2">
                    {b.total_price != null ? b.total_price : "-"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {b.status !== "completed" && (
                        <button
                          className="text-xs border rounded px-2 py-1"
                          onClick={() => updateStatus(b.id, "completed")}
                        >
                          Complete
                        </button>
                      )}
                      {b.status !== "cancelled" && (
                        <button
                          className="text-xs border rounded px-2 py-1"
                          onClick={() => updateStatus(b.id, "cancelled")}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
