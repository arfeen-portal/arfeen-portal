import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRecord = Record<string, any>;

type FlightLeg = {
  flight_no?: string;
  dep_date?: string;
  dep_time?: string;
  from_city?: string;
  to_city?: string;
  class_code?: string;
  arr_date?: string;
  arr_time?: string;
  baggage?: string;
  terminal?: string;
  notes?: string;
};

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeStatus(value: unknown): string {
  const status = String(value || "draft").toLowerCase();
  return ["draft", "published", "locked", "closed"].includes(status)
    ? status
    : "draft";
}

function normalizeGroupType(value: unknown): string {
  const type = String(value || "umrah_group").toLowerCase();
  return type === "one_way_group" ? "one_way_group" : "umrah_group";
}

function normalizeFlightSchedule(value: unknown): FlightLeg[] {
  if (!Array.isArray(value)) return [];

  return value.map((leg) => ({
    flight_no: String(leg?.flight_no || "").toUpperCase(),
    dep_date: String(leg?.dep_date || ""),
    dep_time: String(leg?.dep_time || ""),
    from_city: String(leg?.from_city || ""),
    to_city: String(leg?.to_city || ""),
    class_code: String(leg?.class_code || ""),
    arr_date: String(leg?.arr_date || ""),
    arr_time: String(leg?.arr_time || ""),
    baggage: String(leg?.baggage || ""),
    terminal: String(leg?.terminal || ""),
    notes: String(leg?.notes || ""),
  }));
}

function calculateGroup(body: AnyRecord) {
  const totalSeats = toNumber(body.total_seats);
  const reservedSeats = toNumber(body.reserved_seats);
  const availableSeats = Math.max(totalSeats - reservedSeats, 0);

  const buying = toNumber(body.buying_price_per_seat);
  const targetMargin = toNumber(body.target_margin_percent);

  const aiSuggestedB2B = Math.round(buying + buying * (targetMargin / 100));
  const aiSuggestedB2C = Math.round(aiSuggestedB2B + aiSuggestedB2B * 0.08);

  const b2bSelling = toNumber(body.b2b_selling_price_per_seat) || aiSuggestedB2B;
  const b2cSelling = toNumber(body.b2c_selling_price_per_seat) || aiSuggestedB2C;

  const profitPerSeatB2B = b2bSelling - buying;
  const profitPerSeatB2C = b2cSelling - buying;

  const totalProfitB2B = profitPerSeatB2B * reservedSeats;
  const totalProfitB2C = profitPerSeatB2C * reservedSeats;

  const profitLeakStatus =
    buying > 0 && b2bSelling < aiSuggestedB2B ? "danger" : "safe";

  const riskStatus =
    buying <= 0
      ? "buying_missing"
      : totalSeats <= 0
        ? "seats_missing"
        : availableSeats <= 0
          ? "sold_out"
          : profitLeakStatus === "danger"
            ? "margin_leak"
            : availableSeats <= Math.max(3, totalSeats * 0.15)
              ? "low_inventory"
              : "normal";

  const aiRecommendation =
    buying <= 0
      ? "Enter buying price to activate AI margin optimizer."
      : totalSeats <= 0
        ? "Enter total seats before publishing this group."
        : profitLeakStatus === "danger"
          ? "B2B selling is below target margin. Increase selling price or renegotiate buying."
          : availableSeats <= 0
            ? "Group is sold out. Lock PNR and reconcile supplier payment."
            : availableSeats <= Math.max(3, totalSeats * 0.15)
              ? "Only limited seats remain. Trigger urgency message for agents."
              : "Margin and inventory are healthy. Continue selling this group.";

  return {
    available_seats: availableSeats,
    ai_suggested_b2b_price: aiSuggestedB2B,
    ai_suggested_b2c_price: aiSuggestedB2C,
    profit_per_seat_b2b: profitPerSeatB2B,
    profit_per_seat_b2c: profitPerSeatB2C,
    total_profit_b2b: totalProfitB2B,
    total_profit_b2c: totalProfitB2C,
    profit_leak_status: profitLeakStatus,
    risk_status: riskStatus,
    ai_recommendation: aiRecommendation,
  };
}

function buildPayload(body: AnyRecord): AnyRecord {
  const computed = calculateGroup(body);
  const status = normalizeStatus(body.status);
  const groupType = normalizeGroupType(body.group_type);
  const airlineValue = body.airline || body.airline_name || null;

  return {
    group_name: body.group_name || null,
    group_code: body.group_code || null,

    airline: airlineValue,
    airline_name: airlineValue,

    supplier_id: body.supplier_id || null,
    supplier_name: body.supplier_name || null,
    supplier_code: body.supplier_code || null,
    supplier_ledger_account_id: body.supplier_ledger_account_id || null,
    supplier_payable_amount:
      toNumber(body.supplier_payable_amount) ||
      toNumber(body.buying_price_per_seat) * toNumber(body.total_seats),
    supplier_payment_status: body.supplier_payment_status || "unpaid",

    group_type: groupType,
    status,
    from_city: body.from_city || null,
    to_city: body.to_city || null,
    departure_date: body.departure_date || null,
    return_date: groupType === "one_way_group" ? null : body.return_date || null,
    total_seats: toNumber(body.total_seats),
    reserved_seats: toNumber(body.reserved_seats),
    available_seats: computed.available_seats,
    pnr: body.pnr || null,
    flight_schedule: normalizeFlightSchedule(body.flight_schedule),

    buying_currency: body.buying_currency || "PKR",
    selling_currency: body.selling_currency || "PKR",
    exchange_rate_to_pkr: toNumber(body.exchange_rate_to_pkr) || 1,
    buying_price_per_seat: toNumber(body.buying_price_per_seat),
    b2b_selling_price_per_seat: toNumber(body.b2b_selling_price_per_seat),
    b2c_selling_price_per_seat: toNumber(body.b2c_selling_price_per_seat),
    target_margin_percent: toNumber(body.target_margin_percent),

    ai_suggested_b2b_price: computed.ai_suggested_b2b_price,
    ai_suggested_b2c_price: computed.ai_suggested_b2c_price,
    profit_per_seat_b2b: computed.profit_per_seat_b2b,
    profit_per_seat_b2c: computed.profit_per_seat_b2c,
    total_profit_b2b: computed.total_profit_b2b,
    total_profit_b2c: computed.total_profit_b2c,
    profit_leak_status: computed.profit_leak_status,
    risk_status: computed.risk_status,
    ai_recommendation: computed.ai_recommendation,

    pnr_text: body.pnr_text || null,
    parsed_pnr_json: body.parsed_pnr_json || {},
    is_locked: Boolean(body.is_locked),
    published_at: status === "published" ? new Date().toISOString() : null,
  };
}

function missingColumnName(errorMessage: string): string | null {
  const match = errorMessage.match(/'([^']+)' column/i);
  return match?.[1] || null;
}

async function safeInsertOrUpdate({
  supabase,
  payload,
  id,
}: {
  supabase: any;
  payload: AnyRecord;
  id?: string;
}) {
  let currentPayload = { ...payload };
  const removedColumns: string[] = [];

  for (let attempt = 0; attempt < 25; attempt += 1) {
    const query = id
      ? supabase
          .from("umrah_airline_groups")
          .update(currentPayload)
          .eq("id", id)
          .select("*")
          .single()
      : supabase
          .from("umrah_airline_groups")
          .insert([currentPayload])
          .select("*")
          .single();

    const { data, error } = await query;

    if (!error) {
      return { data, error: null, removedColumns };
    }

    const missing = missingColumnName(error.message || "");
    if (!missing || !(missing in currentPayload)) {
      return { data: null, error, removedColumns };
    }

    delete currentPayload[missing];
    removedColumns.push(missing);
  }

  return {
    data: null,
    error: { message: "Could not save group after schema compatibility retries." },
    removedColumns,
  };
}

async function loadSuppliers(supabase: any) {
  const sources = [
    { table: "suppliers", labelField: "name", codeField: "supplier_code" },
    { table: "chart_of_accounts", labelField: "account_name", codeField: "account_code" },
    { table: "finance_accounts", labelField: "account_name", codeField: "account_code" },
    { table: "accounts", labelField: "name", codeField: "code" },
  ];

  for (const source of sources) {
    const { data, error } = await supabase.from(source.table).select("*").limit(200);

    if (!error && Array.isArray(data)) {
      const suppliers = data
        .filter((row: AnyRecord) => {
          const joined = JSON.stringify(row).toLowerCase();
          return (
            source.table === "suppliers" ||
            joined.includes("supplier") ||
            joined.includes("vendor") ||
            joined.includes("airline")
          );
        })
        .map((row: AnyRecord) => ({
          id: String(row.id || ""),
          name: String(
            row[source.labelField] ||
              row.name ||
              row.account_name ||
              row.supplier_name ||
              "Unnamed Supplier"
          ),
          code: String(row[source.codeField] || row.code || row.account_code || ""),
          ledger_account_id: String(row.ledger_account_id || row.account_id || row.id || ""),
          source_table: source.table,
        }))
        .filter((row: AnyRecord) => row.id && row.name);

      return suppliers;
    }
  }

  return [];
}

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json({
      ok: false,
      error: "Supabase admin client not configured.",
      data: [],
    });
  }

  const { searchParams } = new URL(req.url);

  if (searchParams.get("suppliers") === "1") {
    const suppliers = await loadSuppliers(supabase);
    return NextResponse.json({ ok: true, data: suppliers });
  }

  const admin = searchParams.get("admin") === "1";
  const groupType = searchParams.get("group_type");
  const status = searchParams.get("status");

  let query = supabase
    .from("umrah_airline_groups")
    .select("*")
    .order("created_at", { ascending: false });

  if (!admin) query = query.eq("status", "published");
  if (groupType && groupType !== "all") query = query.eq("group_type", groupType);
  if (admin && status && status !== "all") query = query.eq("status", status);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ ok: false, error: error.message, data: [] });
  }

  return NextResponse.json({ ok: true, data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase admin client not configured." },
      { status: 500 }
    );
  }

  const body = await req.json();
  const payload = buildPayload(body);
  const result = await safeInsertOrUpdate({ supabase, payload });

  if (result.error) {
    return NextResponse.json(
      { ok: false, error: result.error.message, removedColumns: result.removedColumns },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: result.data,
    removedColumns: result.removedColumns,
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase admin client not configured." },
      { status: 500 }
    );
  }

  const body = await req.json();
  const id = body.id;

  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Missing group id." },
      { status: 400 }
    );
  }

  const payload = buildPayload(body);
  const result = await safeInsertOrUpdate({ supabase, payload, id });

  if (result.error) {
    return NextResponse.json(
      { ok: false, error: result.error.message, removedColumns: result.removedColumns },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: result.data,
    removedColumns: result.removedColumns,
  });
}