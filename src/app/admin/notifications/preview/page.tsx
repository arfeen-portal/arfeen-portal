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

  const demoTransport = {
    customerName: "Ahmed",
    driverName: "Ali",
    pickupCity: "Jeddah",
    dropoffCity: "Makkah",
    pickupTime: "10:00 PM",
    vehicleType: "GMC",
    bookingId: "TR-12345",
  };

  const demoPackage = {
    customerName: "Ahmed",
    packageName: "Ramadan Deluxe 10 Nights",
    checkInDate: "10 Ramadan",
    checkOutDate: "20 Ramadan",
    bookingId: "PKG-555",
  };

  function generateSamples() {
    setTransportCustomerText(
      buildTransportCustomerMessage(demoTransport)
    );
    setTransportDriverText(
      buildTransportDriverMessage(demoTransport)
    );
    setPackageCustomerText(
      buildPackageCustomerMessage(demoPackage)
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Notification Preview</h1>

      <button
        className="px-4 py-2 rounded bg-blue-600 text-white"
        onClick={generateSamples}
      >
        Generate sample texts
      </button>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-2">
          <h2 className="font-medium">Transport – Customer</h2>
          <textarea
            className="border rounded p-2 min-h-[160px]"
            readOnly
            value={transportCustomerText}
          />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="font-medium">Transport – Driver</h2>
          <textarea
            className="border rounded p-2 min-h-[160px]"
            readOnly
            value={transportDriverText}
          />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="font-medium">Package – Customer</h2>
          <textarea
            className="border rounded p-2 min-h-[160px]"
            readOnly
            value={packageCustomerText}
          />
        </div>
      </div>
    </div>
  );
}
