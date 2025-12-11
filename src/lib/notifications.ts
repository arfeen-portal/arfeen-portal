// src/lib/notifications.ts
// ❗ Ye file sirf TEXT banane ke helpers rakhegi.
// Expo / React Native imports YAHAN NAHIN honge.

export type TransportMessageInput = {
  customerName?: string;
  driverName?: string;
  pickupCity: string;
  dropoffCity: string;
  pickupTime: string; // already formatted for SMS/WhatsApp
  vehicleType: string;
  bookingId?: string | number;
};

export type PackageMessageInput = {
  customerName?: string;
  packageName: string;
  checkInDate: string;
  checkOutDate: string;
  bookingId?: string | number;
};

export function buildTransportCustomerMessage(input: TransportMessageInput) {
  const {
    customerName = "Dear Guest",
    pickupCity,
    dropoffCity,
    pickupTime,
    vehicleType,
    bookingId,
  } = input;

  return (
    `Assalamualaikum ${customerName}! ` +
    `Your transport booking is CONFIRMED from ${pickupCity} to ${dropoffCity}. ` +
    `Pickup time: ${pickupTime}, Vehicle: ${vehicleType}. ` +
    (bookingId ? `Booking ID: ${bookingId}. ` : "") +
    `JazakAllah for choosing Arfeen Travel.`
  );
}

export function buildTransportDriverMessage(input: TransportMessageInput) {
  const {
    driverName = "Dear Driver",
    pickupCity,
    dropoffCity,
    pickupTime,
    vehicleType,
    bookingId,
  } = input;

  return (
    `${driverName}, new ride assigned ` +
    `from ${pickupCity} to ${dropoffCity}. ` +
    `Pickup time: ${pickupTime}, Vehicle: ${vehicleType}. ` +
    (bookingId ? `Booking ID: ${bookingId}. ` : "") +
    `Please be on time and keep passenger updated.`
  );
}

export function buildPackageCustomerMessage(input: PackageMessageInput) {
  const {
    customerName = "Dear Guest",
    packageName,
    checkInDate,
    checkOutDate,
    bookingId,
  } = input;

  return (
    `Assalamualaikum ${customerName}! ` +
    `Your package "${packageName}" is confirmed. ` +
    `Check-in: ${checkInDate}, Check-out: ${checkOutDate}. ` +
    (bookingId ? `Booking ID: ${bookingId}. ` : "") +
    `For any help, contact Arfeen Travel support.`
  );
}
