import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, context: any) {
  const { params } = context;
  const { id } = params;

  // ⬇️ Yahan se neeche tumhara PURANA code jaisa ka taisa rahega

  const supabase = createClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("white_label_tenants")
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ item: data });
}
