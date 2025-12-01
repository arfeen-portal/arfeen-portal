// src/app/transport/book/[id]/page.tsx

import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type RouteParams = { id: string };

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  // ✅ nayi Next.js me params Promise hai, is liye await karna zaroori
  const { id } = await params;

  if (!id) {
    return (
      <div className="p-4 space-y-2">
        <p className="text-red-600 text-sm">
          Invalid booking id (route param missing).
        </p>
        <Link href="/transport/book" className="text-blue-600 underline text-sm">
          ← Back to bookings
        </Link>
      </div>
    );
  }

  const { data: booking, error } = await supabase
    .from("transport_bookings")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return (
      <div className="p-4 space-y-2">
        <p className="text-red-600 text-sm">
          Error loading booking: {error.message}
        </p>
        <Link href="/transport/book" className="text-blue-600 underline text-sm">
          ← Back
        </Link>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-4 space-y-2">
        <p className="text-gray-600 text-sm">Booking not found.</p>
        <Link href="/transport/book" className="text-blue-600 underline text-sm">
          ← Back
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Link
        href="/transport/book"
        className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
      >
        ← Back to Bookings
      </Link>

      <h1 className="text-xl font-semibold">Booking Details</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {/* ROUTE */}
        <div className="rounded border bg-white p-4 text-sm space-y-1">
          <h2 className="text-xs font-semibold uppercase text-gray-500">
            Route
          </h2>
          <p className="font-medium">
            {booking.pickup_location} → {booking.drop_location}
          </p>
          <p className="text-xs text-gray-500">
            City: {booking.city}, {booking.country}
          </p>
          <p className="text-xs text-gray-500">
            Transfer date: {booking.transfer_date}
          </p>
        </div>

        {/* BOOKING INFO */}
        <div className="rounded border bg-white p-4 text-sm space-y-1">
          <h2 className="text-xs font-semibold uppercase text-gray-500">
            Booking Info
          </h2>
          <div className="flex justify-between">
            <span>Pax</span>
            <span>{booking.pax_count}</span>
          </div>
          <div className="flex justify-between">
            <span>Vehicle</span>
            <span>{booking.vehicle_class}</span>
          </div>
          <div className="flex justify-between">
            <span>Status</span>
            <span className="rounded-full border px-2 py-0.5 text-xs">
              {booking.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Price</span>
            <span>
              {booking.currency} {booking.price}
            </span>
          </div>
        </div>

        {/* HOTEL / NOTES */}
        <div className="rounded border bg-white p-4 text-sm md:col-span-2">
          <h2 className="text-xs font-semibold uppercase text-gray-500">
            Hotel / Notes
          </h2>
          <p className="mt-1">{booking.hotel_name || "—"}</p>
        </div>
      </div>

      <details className="text-xs text-gray-500">
        <summary>Debug JSON</summary>
        <pre className="bg-gray-50 p-2 mt-2 rounded">
          {JSON.stringify(booking, null, 2)}
        </pre>
      </details>
    </div>
  );
}
