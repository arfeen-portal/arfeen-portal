// src/lib/accounting/postBooking.ts

// Simple placeholder implementation for now.
// Future me yahan proper journal entries / ledger posting ayegi.

export type PostBookingPayload = any;

export async function postBooking(payload: PostBookingPayload) {
  console.log("postBooking placeholder:", payload);
}

/**
 * Some places import postBookingToAccounts – keep a wrapper
 * so TypeScript is happy. Internally yeh abhi postBooking ko hi call karega.
 */
export async function postBookingToAccounts(payload: PostBookingPayload) {
  return postBooking(payload);
}
