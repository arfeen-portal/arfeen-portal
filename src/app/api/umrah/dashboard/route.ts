import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const [packagesRes, inventoryRes, profitRes] = await Promise.all([
    supabase.from("umrah_packages").select("*").order("created_at", { ascending: false }),
    supabase.from("umrah_inventory_items").select("*").order("created_at", { ascending: false }),
    supabase.from("v_umrah_package_profit").select("*"),
  ]);

  return NextResponse.json({
    packages: packagesRes.data || [],
    inventory: inventoryRes.data || [],
    profit: profitRes.data || [],
  });
}