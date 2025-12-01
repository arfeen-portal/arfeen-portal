"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type BookingStatus = "pending" | "confirmed" | "cancelled";

interface BookingInfo {
  id: string;
  full_name: string;
  phone: string;
  passengers: number;
  status: BookingStatus;
  tracking_enabled: boolean;
  agent_code: string | null;
  package_code: string | null;
  package_origin: string | null;
  package_dates: string | null;
}

interface TripEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string | null;
  event_time: string;
  lat: number | null;
  lng: number | null;
}

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BookingTimelinePage({
  params,
}: {
  params: { id: string };
}) {
  const bookingId = params.id;
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [events, setEvents] = useState<TripEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: bData, error: bError } = await supabase
          .from("umrah_bookings")
          .select(
            `
            id,
            full_name,
            phone,
            passengers,
            status,
            tracking_enabled,
            agent_code,
            umrah_packages:package_id (
              code,
              origin_city,
              date_range
            )
          `
          )
          .eq("id", bookingId)
          .single();

        if (bError || !bData) {
          throw bError || new Error("Booking not found");
        }

        const pkg = (bData as any).umrah_packages;

        const bookingInfo: BookingInfo = {
          id: bData.id,
          full_name: bData.full_name,
          phone: bData.phone,
          passengers: bData.passengers ?? 1,
          status: (bData.status ?? "pending") as BookingStatus,
          tracking_enabled: !!(bData as any).tracking_enabled,
          agent_code: bData.agent_code ?? null,
          package_code: pkg?.code ?? null,
          package_origin: pkg?.origin_city ?? null,
          package_dates: pkg?.date_range ?? null,
        };
        setBooking(bookingInfo);

        const { data: eData, error: eError } = await supabase
          .from("umrah_trip_events")
          .select(
            "id, title, description, event_type, event_time, lat, lng"
          )
          .eq("booking_id", bookingId)
          .order("event_time", { ascending: true });

        if (eError) throw eError;

        const eventsMapped: TripEvent[] =
          eData?.map((e: any) => ({
            id: e.id,
            title: e.title,
            description: e.description,
            event_type: e.event_type,
            event_time: e.event_time,
            lat: e.lat,
            lng: e.lng,
          })) ?? [];

        setEvents(eventsMapped);
      } catch (err) {
        console.error(err);
        setError("Failed to load trip timeline.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [bookingId]);

  const isB2B = booking?.agent_code ? true : false;

  return (
    <main className="min-h-screen bg-slate-100 pb-12">
      <div className="mx-auto max-w-4xl px-4 pt-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Trip timeline
            </h1>
            <p className="mt-1 text-xs md:text-sm text-slate-500">
              Family locator &amp; journey events for this Umrah booking
              (B2C only).
            </p>
          </div>
          <a
            href="/admin/umrah-bookings"
            className="rounded-full bg-slate-900 px-4 py-2 text-[11px] font-semibold text-slate-100"
          >
            Back to bookings
          </a>
        </header>

        {/* Booking summary */}
        {booking && (
          <section className="mb-4 rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase">
                  Passenger
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {booking.full_name}
                </div>
                <div className="text-[11px] text-slate-500">
                  {booking.phone} · {booking.passengers} pax
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase">
                  Package
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  {booking.package_code ?? "(No Code)"}
                </div>
                <div className="text-[11px] text-slate-500">
                  {booking.package_origin ?? "-"} ·{" "}
                  {booking.package_dates ?? "-"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-500 uppercase">
                  Booking type
                </div>
                {isB2B ? (
                  <div className="text-[11px] font-semibold text-slate-800">
                    B2B (agent: {booking.agent_code})
                  </div>
                ) : (
                  <div className="text-[11px] font-semibold text-emerald-700">
                    Direct B2C booking
                  </div>
                )}
                <div className="mt-1 text-[11px] text-slate-500">
                  Tracking:{" "}
                  {booking.tracking_enabled ? "Enabled" : "Disabled"}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Privacy / B2B logic */}
        {isB2B ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 shadow-sm">
            This is a <strong>B2B booking</strong> through an agent. Family
            locator &amp; live trip timeline are{" "}
            <strong>disabled to protect the agent&apos;s client privacy</strong>{" "}
            and to avoid exposing the supplier to their customer.
          </section>
        ) : booking && !booking.tracking_enabled ? (
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 shadow-sm">
            Tracking is <strong>disabled</strong> for this booking. To
            enable family locator for similar bookings, keep
            &quot;Enable family live tracking&quot; checked on the
            public booking form (B2C only).
          </section>
        ) : null}

        {/* Errors */}
        {error && (
          <div className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Timeline list – only B2C + tracking on */}
        {!isB2B && booking?.tracking_enabled && (
          <section className="mt-4 rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-800">
              Journey events
            </h2>

            {loading ? (
              <div className="text-xs text-slate-500">
                Loading timeline…
              </div>
            ) : events.length === 0 ? (
              <div className="text-xs text-slate-500">
                No events recorded yet. When the Arfeen app sends
                location / status updates, they will appear here in
                order (airport arrival, hotel check-in, Umrah done,
                travel to Madinah, etc.).
              </div>
            ) : (
              <ol className="relative border-l border-slate-200 pl-4">
                {events.map((ev) => (
                  <li key={ev.id} className="mb-4 ml-1">
                    <div className="absolute -left-[9px] mt-1 h-3 w-3 rounded-full bg-sky-500" />
                    <div className="text-[11px] text-slate-500">
                      {formatDateTime(ev.event_time)}
                    </div>
                    <div className="text-xs font-semibold text-slate-900">
                      {ev.title}
                    </div>
                    {ev.description && (
                      <div className="text-[11px] text-slate-600">
                        {ev.description}
                      </div>
                    )}
                    {ev.lat != null && ev.lng != null && (
                      <div className="mt-1 text-[10px] text-slate-400">
                        Location: {ev.lat.toFixed(5)},{" "}
                        {ev.lng.toFixed(5)}
                      </div>
                    )}
                    {ev.event_type && (
                      <div className="mt-0.5 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {ev.event_type}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
