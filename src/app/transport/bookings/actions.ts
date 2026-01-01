"use server";

import { createClient } from "@/utils/supabase/server"; // service-role client (tumhari existing pattern ke mutabiq)
export const dynamic = "force-dynamic";

export async function createTransportBookingAndPost(formData: FormData) {
  const supabase = await createClient();

  const agentId = formData.get("agent_id") as string;
  const route = formData.get("route") as string; // e.g. "JED→Makkah"
  const amount = Number(formData.get("amount") || 0);
  const travelDate = formData.get("travel_date") as string; // yyyy-mm-dd

  // 1) booking table me insert
  const { data: booking, error: bookingError } = await supabase
    .from("transport_bookings")          // 👈 yahan apna actual table name lagao
    .insert({
      agent_id: agentId,
      route,
      amount,
      travel_date: travelDate,
      status: "confirmed",
    })
    .select("id")
    .single();

  if (bookingError || !booking) {
    throw bookingError || new Error("Booking insert failed");
  }

  // 2) accounting posting
  // NOTE: yahan COA me se correct account_ids use karo
  const TRANSPORT_REVENUE_ACCOUNT = "PUT-4101-ACCOUNT-UUID-HERE";
  const AGENT_RECEIVABLE_ACCOUNT = "PUT-1301-ACCOUNT-UUID-HERE";

  const { data: journalId, error: postError } = await supabase.rpc(
    "acc_post_booking",
    {
      p_booking_id: booking.id,
      p_booking_type: "transport",
      p_entry_date: travelDate,
      p_description: `Transport booking ${route}`,
      p_reference: `TR-${booking.id}`,
      p_revenue_account: TRANSPORT_REVENUE_ACCOUNT,
      p_receivable_account: AGENT_RECEIVABLE_ACCOUNT,
      p_amount: amount,
      p_currency_code: "SAR",
      p_fx_rate: 1,
      p_party_type: "agent",
      p_party_id: agentId,
    }
  );

  if (postError) {
    console.error("Posting error", postError);
    // optional: rollback booking, or mark as "unposted"
  }

  return { bookingId: booking.id, journalId };
}
