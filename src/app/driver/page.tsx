"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type DriverBooking = {
  id: string;
  pickup_city: string | null;
  dropoff_city: string | null;
  pickup_time: string | null;
  status: string | null;
  passenger_name: string | null;
  vehicle_type: string | null;
};

const statusLabels: Record<string, string> = {
  ASSIGNED: "Assigned",
  ON_ROUTE: "On route",
  COMPLETED: "Completed",
};

const statusOrder = ["ASSIGNED", "ON_ROUTE", "COMPLETED"];

export default function DriverHome() {
  const supabase = createClient();
  const [driverId, setDriverId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<DriverBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadDriverAndBookings = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setDriverId(null);
      setBookings([]);
      setLoading(false);
      return;
    }

    setDriverId(user.id);

    const { data } = await supabase
      .from("transport_bookings")
      .select(
        "id, pickup_city, dropoff_city, pickup_time, status, passenger_name, vehicle_type"
      )
      .eq("driver_id", user.id)
      .order("pickup_time", { ascending: true });

    setBookings((data as DriverBooking[]) || []);
    setLoading(false);
  };

  const updateStatus = async (bookingId: string, newStatus: string) => {
    setUpdatingId(bookingId);
    await supabase
      .from("transport_bookings")
      .update({ status: newStatus })
      .eq("id", bookingId);

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );
    setUpdatingId(null);
  };

  useEffect(() => {
    loadDriverAndBookings();
    // optional: auto-refresh every 60s
    const interval = setInterval(loadDriverAndBookings, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="p-6">Loading driver bookings...</div>;

  if (!driverId)
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto bg-white border rounded-lg shadow p-5 space-y-2">
          <h1 className="text-lg font-semibold">Driver login required</h1>
          <p className="text-sm text-slate-600">
            Please login as a driver user to see assigned rides.
          </p>
        </div>
      </div>
    );

  const active = bookings.filter(
    (b) => b.status !== "COMPLETED"
  );
  const completed = bookings.filter((b) => b.status === "COMPLETED");

  return (
    <div className="space-y-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold">Driver Panel</h1>
            <p className="text-xs text-slate-500 mt-1">
              View today&apos;s pickups and update ride status in real-time.
            </p>
          </div>
          <button
            onClick={loadDriverAndBookings}
            className="px-3 py-1.5 text-xs rounded-md border bg-white hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {/* Active rides */}
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-2">
            Active rides
          </h2>
          <div className="space-y-3">
            {active.map((b) => (
              <div
                key={b.id}
                className="bg-white border rounded-xl shadow-sm p-4 flex flex-col gap-2"
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {b.pickup_city} → {b.dropoff_city}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Passenger:{" "}
                      <span className="font-medium">
                        {b.passenger_name || "-"}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Vehicle: {b.vehicle_type || "-"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Pickup:{" "}
                      {b.pickup_time
                        ? b.pickup_time.replace("T", " ").slice(0, 16)
                        : "-"}
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                    {statusLabels[b.status || "ASSIGNED"] || "Assigned"}
                  </span>
                </div>

                <div className="flex gap-2 mt-1">
                  {statusOrder.map((st) => (
                    <button
                      key={st}
                      onClick={() => updateStatus(b.id, st)}
                      disabled={updatingId === b.id}
                      className={`px-2.5 py-1 text-[11px] rounded-md border ${
                        b.status === st
                          ? "bg-slate-900 text-white"
                          : "bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      {statusLabels[st]}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {active.length === 0 && (
              <p className="text-xs text-slate-500">
                No active rides right now.
              </p>
            )}
          </div>
        </section>

        {/* Completed rides */}
        <section>
          <h2 className="text-sm font-semibold text-slate-700 mb-2">
            Completed rides
          </h2>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {completed.map((b) => (
              <div
                key={b.id}
                className="bg-slate-100 border border-slate-200 rounded-xl p-3 flex justify-between items-center"
              >
                <div>
                  <p className="text-xs font-medium">
                    {b.pickup_city} → {b.dropoff_city}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {b.passenger_name || "-"} •{" "}
                    {b.pickup_time
                      ? b.pickup_time.replace("T", " ").slice(0, 16)
                      : "-"}
                  </p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-green-100 text-green-700">
                  Completed
                </span>
              </div>
            ))}

            {completed.length === 0 && (
              <p className="text-xs text-slate-500">
                No completed rides yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
