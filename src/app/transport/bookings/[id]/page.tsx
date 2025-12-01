import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

type PageProps = {
  params: { id: string };
};

export default async function BookingDetailPage({ params }: PageProps) {
  const supabase = createClient();
  const bookingId = params.id;

  const { data, error } = await supabase
    .from("transport_bookings")
    .select("*")
    .eq("id", bookingId)
    .single();

  const booking: any = data;

  if (error || !booking) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">Booking not found</h1>
        <p className="text-gray-500 mt-2">{error?.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Booking #{booking.reference || booking.id}
        </h1>
        <span className="px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200">
          {booking.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Booking Info */}
        <div className="col-span-2 bg-white rounded-xl shadow border p-4 space-y-3">
          <div className="flex justify-between">
            <div>
              <p className="text-xs text-gray-500">Pickup</p>
              <p className="font-semibold">{booking.pickup_city}</p>
            </div>
            <div className="text-center text-gray-400">→</div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Dropoff</p>
              <p className="font-semibold">{booking.dropoff_city}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Pickup Time</p>
              <p className="font-medium">
                {booking.pickup_time
                  ? new Date(booking.pickup_time).toLocaleString()
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Passenger</p>
              <p className="font-medium">{booking.passenger_name || "-"}</p>
            </div>
            <div>
              <p className="text-gray-500">Agent</p>
              <p className="font-medium">{booking.agent_name || "-"}</p>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <Link
              href={`/tracking/booking/${booking.id}`}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              Track Live Location
            </Link>

            <Link
              href={`/vouchers/transport/${booking.id}`}
              className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50"
            >
              View / Print Voucher
            </Link>
          </div>
        </div>

        {/* Driver card – abhi simple string fields use karte hain */}
        <div className="bg-white rounded-xl shadow border p-4 space-y-2">
          <h2 className="font-semibold mb-2">Driver</h2>
          <p className="text-sm font-medium">
            {booking.driver_name || "Not assigned"}
          </p>
          <p className="text-sm text-gray-500">
            {booking.driver_phone || "-"}
          </p>

          <p className="text-xs text-gray-400 mt-2">
            Live tracking is based on the driver’s mobile app.
          </p>
        </div>
      </div>
    </div>
  );
}
