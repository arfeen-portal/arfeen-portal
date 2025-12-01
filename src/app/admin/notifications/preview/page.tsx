// src/app/admin/notifications/preview/page.tsx
"use client";

import { useState } from "react";
import {
  buildTransportCustomerMessage,
  buildTransportDriverMessage,
  buildPackageCustomerMessage,
} from "@/lib/notifications";

export default function NotificationPreviewPage() {
  const [transportCustomerText, setTransportCustomerText] = useState("");
  const [transportDriverText, setTransportDriverText] = useState("");
  const [packageCustomerText, setPackageCustomerText] = useState("");

  function generateSamples() {
    setTransportCustomerText(
      buildTransportCustomerMessage({
        bookingRef: "TR-2025-045",
        passengerName: "Arfeen Group A",
        passengers: 5,
        pickupCity: "Jeddah Airport",
        dropoffCity: "Makkah Hotel",
        date: "24 Nov 2025",
        time: "10:30",
        vehicleType: "GMC",
        driverName: "Ahmed Ali",
        driverPhone: "+966 5X XXX XXXX",
      })
    );

    setTransportDriverText(
      buildTransportDriverMessage({
        bookingRef: "TR-2025-045",
        passengerName: "Arfeen Group A",
        passengers: 5,
        pickupCity: "Jeddah Airport",
        dropoffCity: "Makkah Hotel",
        date: "24 Nov 2025",
        time: "10:30",
        vehicleType: "GMC",
        driverName: "Ahmed Ali",
        driverPhone: "+966 5X XXX XXXX",
      })
    );

    setPackageCustomerText(
      buildPackageCustomerMessage({
        bookingRef: "PKG-AT-2025-001",
        passengerName: "Syed Family Group",
        passengers: 4,
        packageName: "20N Umrah – 12N Makkah + 8N Madinah",
        travelDates: "10 Jan 2026 – 30 Jan 2026",
        totalPrice: "38,000 SAR",
        perPersonPrice: "9,500 SAR",
      })
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
              Automation
            </p>
            <h1 className="text-lg font-semibold text-slate-900">
              Notification Preview
            </h1>
            <p className="text-xs text-slate-500">
              Ready-made WhatsApp / SMS texts – copy & send to customer or
              driver.
            </p>
          </div>
          <button
            onClick={generateSamples}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-black"
          >
            Generate Sample Messages
          </button>
        </div>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
            <p className="text-[11px] font-semibold text-slate-800">
              Transport · Customer
            </p>
            <textarea
              className="mt-2 h-56 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-800 outline-none"
              value={transportCustomerText}
              readOnly
            />
          </div>
          <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
            <p className="text-[11px] font-semibold text-slate-800">
              Transport · Driver
            </p>
            <textarea
              className="mt-2 h-56 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-800 outline-none"
              value={transportDriverText}
              readOnly
            />
          </div>
          <div className="flex flex-col rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
            <p className="text-[11px] font-semibold text-slate-800">
              Umrah Package · Customer
            </p>
            <textarea
              className="mt-2 h-56 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-2 text-[11px] text-slate-800 outline-none"
              value={packageCustomerText}
              readOnly
            />
          </div>
        </section>
      </div>
    </main>
  );
}
