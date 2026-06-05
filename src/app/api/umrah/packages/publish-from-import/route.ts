import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });

  const body = await req.json();
  const importId = body.import_id as string;
  const supplierId = body.supplier_id || null;
  const items = Array.isArray(body.items) ? body.items : [];

  if (!importId) return NextResponse.json({ error: "import_id is required" }, { status: 400 });
  if (!items.length) return NextResponse.json({ error: "No package items found" }, { status: 400 });

  const rows = items.map((item: any) => ({
    import_id: importId,
    item_id: item.id || null,
    package_title: item.package_title || `Umrah Package ${item.package_no || ""}`,
    package_no: item.package_no || null,
    departure_city: item.departure_city || null,
    airline: item.airline || null,
    departure_date: item.departure_date || null,
    return_date: item.return_date || null,
    makkah_hotel: item.makkah_hotel || null,
    madinah_hotel: item.madinah_hotel || null,
    sharing_rate: Number(item.sharing_rate || 0),
    quad_rate: Number(item.quad_rate || 0),
    triple_rate: Number(item.triple_rate || 0),
    double_rate: Number(item.double_rate || 0),
    total_seats: Number(item.available_seats || body.total_seats || 0),
    booked_seats: 0,
    remaining_seats: Number(item.available_seats || body.total_seats || 0),
    supplier_id: supplierId,
    status: "live",
  }));

  const { data, error } = await supabase
    .from("umrah_package_inventory")
    .insert(rows)
    .select("*");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase
    .from("package_imports")
    .update({
      status: "published",
      supplier_id: supplierId,
      published_package_id: data?.[0]?.id || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", importId);

  return NextResponse.json({ success: true, packages: data });
}