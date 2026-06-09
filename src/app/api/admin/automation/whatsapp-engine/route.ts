import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase admin client not configured" },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("whatsapp_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ templates: data || [] });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin client not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const {
      booking_id,
      template_key,
      trigger_event,
      recipient_phone,
      variables = {},
    } = body;

    if (!recipient_phone) {
      return NextResponse.json(
        { error: "recipient_phone is required" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("whatsapp_templates")
      .select("*")
      .eq("is_active", true)
      .limit(1);

    if (template_key) query = query.eq("template_key", template_key);
    if (trigger_event) query = query.eq("trigger_event", trigger_event);

    const { data: templates, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!templates?.length) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const template = templates[0];

    let message = template.body;

    Object.entries(variables).forEach(([key, value]) => {
      message = message.replaceAll(`{{${key}}}`, String(value ?? ""));
    });

    const { data: log, error: logError } = await supabase
      .from("whatsapp_message_logs")
      .insert([
        {
          booking_id,
          template_id: template.id,
          recipient_phone,
          message_body: message,
          trigger_event: trigger_event || template.trigger_event,
          status: "queued",
          provider_response: {
            note: "Queued only. WhatsApp Cloud API can be connected later.",
          },
        },
      ])
      .select("*")
      .single();

    if (logError) {
      return NextResponse.json({ error: logError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      status: "queued",
      message,
      log,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unexpected error" },
      { status: 500 }
    );
  }
}