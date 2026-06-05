import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function detectIntent(text: string) {
  const t = String(text || "").toLowerCase();

  if (
    t.includes("friday") ||
    t.includes("tomorrow") ||
    t.includes("pay") ||
    t.includes("payment") ||
    t.includes("kar dunga") ||
    t.includes("kar dun ga") ||
    t.includes("ادا") ||
    t.includes("جمع")
  ) {
    return "promise_to_pay";
  }

  if (
    t.includes("issue") ||
    t.includes("problem") ||
    t.includes("nahi") ||
    t.includes("later")
  ) {
    return "delay_or_dispute";
  }

  return "general_reply";
}

function detectSentiment(text: string) {
  const t = String(text || "").toLowerCase();

  if (
    t.includes("sorry") ||
    t.includes("pay") ||
    t.includes("kar dunga") ||
    t.includes("kar dun ga")
  ) {
    return "cooperative";
  }

  if (t.includes("problem") || t.includes("issue") || t.includes("nahi")) {
    return "delaying";
  }

  return "neutral";
}

function nextFriday() {
  const d = new Date();
  const day = d.getDay();
  const diff = (5 + 7 - day) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function promisedDateFromText(text: string) {
  const t = String(text || "").toLowerCase();

  if (t.includes("friday")) return nextFriday();
  if (t.includes("tomorrow")) return tomorrow();

  return tomorrow();
}

export async function GET() {
  return NextResponse.json({
    success: true,
    ok: true,
    message: "Accounts recovery webhook route is active.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: "Supabase admin client not configured.",
        },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));

    const tenant_id = body.tenant_id;
    const invoice_no = body.invoice_no || null;
    const phone = body.phone || "";
    const agent_code = body.agent_code || "";
    const agent_name = body.agent_name || "";
    const customer_name = body.customer_name || "";
    const promised_amount = Number(body.promised_amount || 0);

    const customer_reply = body.customer_reply || body.message || "";
    const transcribed_text = body.transcribed_text || "";
    const finalText = transcribed_text || customer_reply;

    if (!tenant_id || !finalText) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: "tenant_id and message/customer_reply are required.",
        },
        { status: 400 }
      );
    }

    const ai_intent = detectIntent(finalText);
    const ai_sentiment = detectSentiment(finalText);
    const promised_date =
      ai_intent === "promise_to_pay" ? promisedDateFromText(finalText) : null;

    const { data: oldPromises } = await supabase
      .from("finance_recovery_promises")
      .select("id,status,broken_count")
      .eq("tenant_id", tenant_id)
      .eq("invoice_no", invoice_no)
      .order("created_at", { ascending: false })
      .limit(5);

    const previousBroken = (oldPromises || []).filter(
      (p: any) => p.status === "broken"
    ).length;

    const broken_count = previousBroken;
    const legal_triggered = previousBroken >= 3;
    const blacklist_recommended = previousBroken >= 3;

    const { data, error } = await supabase
      .from("finance_recovery_promises")
      .insert([
        {
          tenant_id,
          invoice_no,
          phone,
          agent_code,
          agent_name,
          customer_name,
          promised_amount,
          customer_reply,
          transcribed_text,
          ai_intent,
          ai_sentiment,
          ai_confidence: ai_intent === "promise_to_pay" ? 91 : 72,
          promised_date,
          status: ai_intent === "promise_to_pay" ? "promised" : "open",
          recovery_stage:
            ai_intent === "promise_to_pay" ? "promised" : "conversation",
          broken_count,
          legal_triggered,
          blacklist_recommended,
          source: transcribed_text ? "voice_to_finance" : "whatsapp_webhook",
        },
      ])
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ok: true,
      data,
      ai_intent,
      ai_sentiment,
      promised_date,
      legal_triggered,
      blacklist_recommended,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        ok: false,
        error: error?.message || "Unexpected recovery webhook error.",
      },
      { status: 500 }
    );
  }
}