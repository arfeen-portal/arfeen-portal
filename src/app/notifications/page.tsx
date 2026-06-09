"use client";

import { useEffect, useState } from "react";

type NotificationItem = {
  id: number;
  title: string;
  body: string;
  type: string;
  created_at: string;
  is_read: boolean;
};

const mockNotifications: NotificationItem[] = [
  {
    id: 1,
    title: "New Booking Created",
    body: "A new Umrah booking was created successfully.",
    type: "booking",
    created_at: "2 mins ago",
    is_read: false,
  },
  {
    id: 2,
    title: "Payment Received",
    body: "Agent payment has been received and verified.",
    type: "payment",
    created_at: "12 mins ago",
    is_read: true,
  },
  {
    id: 3,
    title: "Driver Assigned",
    body: "A driver was assigned to airport pickup service.",
    type: "transport",
    created_at: "35 mins ago",
    is_read: false,
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNotifications(mockNotifications);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8">
      <section className="mx-auto max-w-7xl rounded-[32px] bg-white p-8 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">
              Notification Center
            </p>

            <h1 className="mt-3 text-3xl font-black text-slate-950">
              System Notifications
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
              Monitor bookings, payments, transport alerts, accounting warnings,
              AI alerts and operational updates across the portal.
            </p>
          </div>

          <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white">
            Mark All Read
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            ["Total Notifications", "128"],
            ["Unread", "18"],
            ["Warnings", "4"],
            ["AI Alerts", "7"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {label}
              </p>

              <h2 className="mt-3 text-4xl font-black text-slate-950">
                {value}
              </h2>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center">
              <p className="text-sm font-semibold text-slate-500">
                Loading notifications...
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-black text-slate-900">
                        {item.title}
                      </h2>

                      {!item.is_read && (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
                          New
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      {item.body}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                      {item.type}
                    </span>

                    <p className="mt-3 text-xs font-semibold text-slate-400">
                      {item.created_at}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}