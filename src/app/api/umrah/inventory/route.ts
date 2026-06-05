import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const type = req.nextUrl.searchParams.get("type");

  let query = supabase
    .from("umrah_inventory_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (type) query = query.eq("item_type", type);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ inventory: data || [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = getSupabaseAdminSafe();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const { data, error } = await supabase
    .from("umrah_inventory_items")
    .insert([body])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ item: data });
}