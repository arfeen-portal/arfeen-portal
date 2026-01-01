"use server";

import { createClient } from "@/utils/supabase/server";
import { postBookingToAccounts } from "@/lib/accounting/postBooking";
export const dynamic = "force-dynamic";

// TODO: apne COA se correct UUIDs copy karo
const TRANSPORT_REVENUE_ACC = "PUT-UUID-4101-HERE";
const AGENT_RECEIVABLE_ACC = "PUT-UUID-1301-HERE";

export async function createTransportBooking(formData: FormData) {
  const supabase = createClient();

  const agentId = formData.get("agent_id") as string;
  const route = formData.get("route") as string;
  const amount = Number(formData.get("amount") || 0);
  const travelDate = formData.get("travel_date") as string;

  const { data: booking, error } = await supabase
    .from("transport_bookings")
    .insert({
      agent_id: agentId,
      route,
      amount,
      travel_date: travelDate,
      status: "confirmed",
    })
    .select("id")
    .single();

  if (error || !booking) {
    throw error || new Error("Booking insert failed");
  }

  const journalId = await postBookingToAccounts({
    bookingId: booking.id,
    bookingType: "transport",
    entryDate: travelDate,
    description: `Transport booking ${route}`,
    reference: `TR-${booking.id}`,
    revenueAccountId: TRANSPORT_REVENUE_ACC,
    receivableAccountId: AGENT_RECEIVABLE_ACC,
    amount,
    partyType: "agent",
    partyId: agentId,
  });

  return { bookingId: booking.id, journalId };
}
