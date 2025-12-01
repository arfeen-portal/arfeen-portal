import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
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
