import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });

  const { data, error } = await supabase
    .from("voucher_intelligence")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ vouchers: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });

  const body = await req.json();

  const itinerary = [
    { day: 1, title: "Arrival & Transfer", detail: body.arrival || "Airport pickup and hotel check-in" },
    { day: 2, title: "Ziyarat / Service Day", detail: body.day_two || "Scheduled service or ziyarat plan" },
    { day: 3, title: "Departure / Next Transfer", detail: body.departure || "Checkout and transfer arrangement" },
  ];

  const payload = {
    booking_ref: body.booking_ref || null,
    customer_name: body.customer_name,
    customer_phone: body.customer_phone || null,
    language: body.language || "en",
    voucher_type: body.voucher_type || "umrah",
    itinerary,
    status: "generated",
    branded_pdf_url: body.branded_pdf_url || null,
    created_by: body.created_by || "admin",
  };

  const { data, error } = await supabase
    .from("voucher_intelligence")
    .insert([payload])
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ voucher: data });
}