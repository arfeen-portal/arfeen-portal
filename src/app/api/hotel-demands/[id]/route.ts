import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";
import { sanitizeDemandForAgent } from "@/lib/hotels/demandVisibility";

export const dynamic = "force-dynamic";

const OPS_ROLES = new Set(["super_admin", "admin", "operations"]);

async function getSessionContext() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("role, name, email")
    .eq("email", user.email.toLowerCase())
    .maybeSingle<{ role: string | null; name: string | null; email: string | null }>();

  return { user, profile };
}

async function requireOps() {
  const session = await getSessionContext();

  if (!session?.profile?.role) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
    };
  }

  if (!OPS_ROLES.has(session.profile.role)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true as const, session };
}

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionContext();

  if (!session?.profile?.role) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin client not configured" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("hotel_demands")
    .select(`
      *,
      hotel_supplier_rfq(*),
      hotel_booking_confirmations(*),
      hotel_hcn_reminders(*),
      hotel_demand_audit_logs(*)
    `)
    .eq("id", params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const role = session.profile.role;

  if (role === "agent") {
    const agentName = (session.profile.name || "").trim();
    const ownsRecord =
      data.agent_id === session.user.id ||
      (agentName && String(data.agent_name || "").toLowerCase().includes(agentName.toLowerCase()));

    if (!ownsRecord) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ data: sanitizeDemandForAgent(data) });
  }

  if (!OPS_ROLES.has(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireOps();
  if (!auth.ok) return auth.response;

  const supabase = getSupabaseAdminSafe();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin client not configured" }, { status: 500 });
  }

  const body = await req.json();
  const action = String(body.action || "update");
  const now = new Date().toISOString();

  let updatePayload: Record<string, unknown> = {
    updated_at: now,
  };

  if (action === "send_quote") {
    const sellingSar = toNumber(body.selling_sar);
    updatePayload = {
      ...updatePayload,
      quoted_supplier: String(body.quoted_supplier || "").trim() || null,
      quoted_room_type: String(body.quoted_room_type || "").trim() || null,
      quoted_meal_plan: String(body.quoted_meal_plan || "").trim() || null,
      supplier_rate: toNumber(body.quoted_sar),
      final_offer_sar: sellingSar,
      final_selling_rate: sellingSar,
      public_note: String(body.public_note || "").trim() || null,
      quote_status: "quotation_sent",
      status: "quoted",
    };
  } else if (action === "update_hcn") {
    const hcnStatus = String(body.hcn_status || "pending");
    updatePayload = {
      ...updatePayload,
      hcn_status: hcnStatus,
      hcn_reference:
        hcnStatus === "received" ? String(body.hcn_reference || "").trim() || null : null,
      hcn: hcnStatus === "received" ? String(body.hcn_reference || "").trim() || null : null,
    };
  } else if (action === "log_reminder") {
    updatePayload = {
      ...updatePayload,
      last_reminder_at: now,
    };
  } else if (action === "update_internal") {
    updatePayload = {
      ...updatePayload,
      internal_note: String(body.internal_note || "").trim() || null,
      status: body.status ? String(body.status) : undefined,
    };
  } else {
    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  }

  Object.keys(updatePayload).forEach((key) => {
    if (updatePayload[key] === undefined) {
      delete updatePayload[key];
    }
  });

  const { data, error } = await supabase
    .from("hotel_demands")
    .update(updatePayload)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("hotel_demand_audit_logs").insert([
    {
      demand_id: params.id,
      action: action.toUpperCase(),
      description: `Hotel demand ${action.replace("_", " ")}.`,
      actor: auth.session.user.email,
      metadata: updatePayload,
    },
  ]);

  return NextResponse.json({ data });
}
