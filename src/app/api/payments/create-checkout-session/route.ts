import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";

/**
 * Build-safe Stripe getter
 */
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;

return new Stripe(key);
 }

export async function POST(req: Request) {
  const supabase = getSupabaseServerClient();
  const stripe = getStripe();

  // ✅ build-time safety
  if (!supabase || !stripe) {
    return NextResponse.json(
      { error: "Payment service not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { invoiceId, tenantId } = body;

    if (!invoiceId || !tenantId) {
      return NextResponse.json(
        { error: "invoiceId and tenantId are required" },
        { status: 400 }
      );
    }

    // 1️⃣ Load invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    if (invoice.status === "paid") {
      return NextResponse.json(
        { error: "Invoice already paid" },
        { status: 400 }
      );
    }

    // 2️⃣ Amount handling (Stripe requires smallest unit)
    const amount = Math.round(
      Number(invoice.total_amount) * 100
    );

    // 3️⃣ Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/success?invoiceId=${invoice.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/cancel?invoiceId=${invoice.id}`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: invoice.billing_currency ?? "usd",
            unit_amount: amount,
            product_data: {
              name: `Invoice #${invoice.id}`,
              description: invoice.booking_reference
                ? `Booking Ref: ${invoice.booking_reference}`
                : "Arfeen Travel Booking",
            },
          },
        },
      ],
      metadata: {
        invoice_id: invoice.id,
        tenant_id: tenantId,
      },
    });

    // 4️⃣ Create payment record (initiated)
    const { error: paymentError } = await supabase
      .from("payments")
      .insert([
        {
          invoice_id: invoice.id,
          tenant_id: tenantId,
          gateway: "stripe",
          gateway_ref: session.id,
          amount: invoice.total_amount,
          currency: invoice.billing_currency,
          status: "initiated",
        },
      ]);

    if (paymentError) {
      console.error("Payment insert error:", paymentError);
    }

    return NextResponse.json(
      {
        checkoutUrl: session.url,
        invoiceId: invoice.id,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Checkout session error:", err);
    return NextResponse.json(
      { error: err.message ?? "Unexpected server error" },
      { status: 500 }
    );
  }
}
