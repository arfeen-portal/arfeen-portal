// src/lib/notifications.ts

// Transport booking notification payload
export type TransportNotificationPayload = {
  bookingRef: string;
  passengerName: string;
  passengers: number;
  pickupCity: string;
  dropoffCity: string;
  date: string;
  time: string;
  vehicleType: string;
  driverName?: string;
  driverPhone?: string;
};

// Customer message (WhatsApp / SMS)
export function buildTransportCustomerMessage(
  p: TransportNotificationPayload
): string {
  return (
    `Assalamualaikum ${p.passengerName},\n\n` +
    `Aap ka Arfeen Travel transport booking confirm ho chuka hai.\n\n` +
    `Booking Ref: ${p.bookingRef}\n` +
    `Route: ${p.pickupCity} → ${p.dropoffCity}\n` +
    `Date: ${p.date}\n` +
    `Time: ${p.time}\n` +
    `Vehicle: ${p.vehicleType}\n` +
    `Passengers: ${p.passengers}\n` +
    (p.driverName
      ? `\nDriver: ${p.driverName}` +
        (p.driverPhone ? ` (${p.driverPhone})` : "") +
        `\n`
      : "") +
    `\nMehrbani kar ke flight se nikalte hi apna WhatsApp on rakhen aur driver se contact me rahen.\n\n` +
    `JazakAllahu khair,\nArfeen Travel`
  );
}

// Driver message
export function buildTransportDriverMessage(
  p: TransportNotificationPayload
): string {
  return (
    `Assalamualaikum ${p.driverName || ""},\n\n` +
    `Naya job Arfeen Travel se assign hua hai.\n\n` +
    `Booking Ref: ${p.bookingRef}\n` +
    `Passenger: ${p.passengerName} (x${p.passengers})\n` +
    `Route: ${p.pickupCity} → ${p.dropoffCity}\n` +
    `Date: ${p.date}\n` +
    `Time: ${p.time}\n` +
    `Vehicle: ${p.vehicleType}\n\n` +
    `Passenger se WhatsApp pe confirm zaroor kar len jab aap pohanch jayein.\n\n` +
    `Arfeen Dispatch`
  );
}

// Package booking payload
export type PackageNotificationPayload = {
  bookingRef: string;
  passengerName: string;
  passengers: number;
  packageName: string;
  travelDates: string;
  totalPrice: string;
  perPersonPrice: string;
};

export function buildPackageCustomerMessage(
  p: PackageNotificationPayload
): string {
  return (
    `Assalamualaikum ${p.passengerName},\n\n` +
    `Aap ka Umrah package Arfeen Travel ke saath confirm ho chuka hai.\n\n` +
    `Booking Ref: ${p.bookingRef}\n` +
    `Package: ${p.packageName}\n` +
    `Travel dates: ${p.travelDates}\n` +
    `Total: ${p.totalPrice}\n` +
    `Per person: ${p.perPersonPrice}\n` +
    `Passengers: ${p.passengers}\n\n` +
    `Detailed voucher aap ko alag se PDF / image ke roop mein share kiya jayega.\n` +
    `Koi question ho to isi WhatsApp par reply kar sakte hain.\n\n` +
    `JazakAllahu khair,\nArfeen Travel`
  );
}
