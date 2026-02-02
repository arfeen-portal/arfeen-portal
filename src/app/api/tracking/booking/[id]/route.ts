import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, context: any) {
  const { params } = context;
  const { id } = params;

  // ⬇️ Yahan se neeche tumhara PURANA code jaisa ka taisa rahega

   const supabase = createSupabaseServerClient();
  const bookingId = params.id;

  const { data, error } = await supabase
    .from("tracking_locations")
    .select("lat,lng,created_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // reverse for oldest → newest
  return NextResponse.json({ data: (data || []).reverse() });
}
