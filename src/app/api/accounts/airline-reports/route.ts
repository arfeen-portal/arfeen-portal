import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TABLE = "airline_bsp_sales";

function num(v: unknown) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function statusOfProfit(profit: number) {
  if (profit < 0) return "loss";
  if (profit <= 1000) return "low_margin";
  return "profitable";
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase admin client not configured." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const airline = searchParams.get("airline")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const from = searchParams.get("from")?.trim() || "";
    const to = searchParams.get("to")?.trim() || "";

    let query = supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        `ticket_no.ilike.%${search}%,pnr.ilike.%${search}%,passenger_name.ilike.%${search}%,sector.ilike.%${search}%,supplier_name.ilike.%${search}%`
      );
    }

    if (airline && airline !== "all") {
      query = query.eq("airline", airline);
    }

    if (status && status !== "all") {
      query = query.eq("settlement_status", status);
    }

    if (from) query = query.gte("travel_date", from);
    if (to) query = query.lte("travel_date", to);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }

    const sales = (data || []).map((r: any) => {
      const sellingPrice = num(r.selling_price);
      const commission = num(r.airline_commission);
      const supplierCost = num(r.supplier_cost);
      const taxes = num(r.taxes);
      const profit = sellingPrice + commission - supplierCost - taxes;

      return {
        ...r,
        computed_profit: profit,
        profit_status: statusOfProfit(profit),
      };
    });

    const summary = sales.reduce(
      (acc, r: any) => {
        const sellingPrice = num(r.selling_price);
        const commission = num(r.airline_commission);
        const supplierCost = num(r.supplier_cost);
        const taxes = num(r.taxes);
        const profit = sellingPrice + commission - supplierCost - taxes;

        acc.totalTickets += 1;
        acc.totalSales += sellingPrice;
        acc.totalCommission += commission;
        acc.totalSupplierCost += supplierCost;
        acc.totalTaxes += taxes;
        acc.profit += profit;

        if (r.settlement_status === "settled") acc.settled += 1;
        else acc.pending += 1;

        if (profit < 0) acc.lossTickets += 1;

        return acc;
      },
      {
        totalTickets: 0,
        totalSales: 0,
        totalCommission: 0,
        totalSupplierCost: 0,
        totalTaxes: 0,
        profit: 0,
        settled: 0,
        pending: 0,
        lossTickets: 0,
      }
    );

    const airlineBreakdown = Object.values(
      sales.reduce((acc: any, r: any) => {
        const key = r.airline || "Unknown";
        const profit =
          num(r.selling_price) +
          num(r.airline_commission) -
          num(r.supplier_cost) -
          num(r.taxes);

        if (!acc[key]) {
          acc[key] = {
            airline: key,
            tickets: 0,
            sales: 0,
            profit: 0,
          };
        }

        acc[key].tickets += 1;
        acc[key].sales += num(r.selling_price);
        acc[key].profit += profit;

        return acc;
      }, {})
    );

    return NextResponse.json({
      ok: true,
      sales,
      summary,
      airlineBreakdown,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unexpected server error." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase admin client not configured." },
        { status: 500 }
      );
    }

    const body = await req.json();

    if (!body.ticket_no?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Ticket number is required." },
        { status: 400 }
      );
    }

    const payload = {
      ticket_no: body.ticket_no?.trim(),
      pnr: body.pnr?.trim() || null,
      passenger_name: body.passenger_name?.trim() || null,
      airline: body.airline?.trim() || null,
      sector: body.sector?.trim() || null,
      supplier_name: body.supplier_name?.trim() || null,
      travel_date: body.travel_date || null,

      selling_price: num(body.selling_price),
      base_fare: num(body.base_fare),
      airline_commission: num(body.airline_commission),
      supplier_cost: num(body.supplier_cost),
      taxes: num(body.taxes),

      settlement_status: body.settlement_status || "pending",
      payment_status: body.payment_status || "unpaid",
      refund_status: body.refund_status || "none",
      notes: body.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(TABLE)
      .insert([payload])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, sale: data });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unexpected server error." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase admin client not configured." },
        { status: 500 }
      );
    }

    const body = await req.json();

    if (!body.id) {
      return NextResponse.json(
        { ok: false, error: "Sale ID is required." },
        { status: 400 }
      );
    }

    const payload: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.settlement_status) payload.settlement_status = body.settlement_status;
    if (body.payment_status) payload.payment_status = body.payment_status;
    if (body.refund_status) payload.refund_status = body.refund_status;
    if (body.notes !== undefined) payload.notes = body.notes;

    const { data, error } = await supabase
      .from(TABLE)
      .update(payload)
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, sale: data });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Unexpected server error." },
      { status: 500 }
    );
  }
}