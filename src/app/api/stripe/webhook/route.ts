import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
export const dynamic = "force-dynamic";
// import Stripe from "stripe";  // if you add stripe later

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();

  // TODO: yahan stripe signature verify karna hota hai.
  // abhi sirf skeleton rakhte hain.

  const eventType = body.type;

  if (eventType === "payment_intent.succeeded") {
    const intent = body.data.object;
    const amount = intent.amount_received / 100;
    const currency = intent.currency.toUpperCase();
    const gatewayRef = intent.id;
    const agentId = intent.metadata?.agent_id as string | undefined;

    const { data: payment } = await supabase
      .from("payments")
      .insert({
        agent_id: agentId,
        amount,
        currency_code: currency,
        status: "succeeded",
        gateway: "stripe",
        gateway_ref: gatewayRef,
        confirmed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (payment) {
      // TODO: correct account IDs set karo
      const BANK_ACC = "PUT-BANK-ACC-UUID";
      const RECEIVABLE_ACC = "PUT-AGENT-REC-ACC-UUID";

      await supabase.rpc("acc_post_online_payment", {
        p_payment_id: payment.id,
        p_bank_account: BANK_ACC,
        p_receivable_account: RECEIVABLE_ACC,
      });

      // rewards trigger
      if (agentId) {
        await supabase.rpc("acc_award_payment_rewards", {
          p_agent_id: agentId,
          p_voucher_id: null, // agar voucher-based lose, yahan adjust
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
