import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";

export async function GET() {
   const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("white_label_tenants")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: Request) {
   const supabase = createSupabaseServerClient();
  const body = await req.json();

  const payload = {
    name: body.name,
    domain: body.domain,
    primary_color: body.primary_color,
    accent_color: body.accent_color,
    logo_url: body.logo_url,
    modules: body.modules ?? {},
    is_active: body.is_active ?? true,
  };

  const { data, error } = await supabase
    .from("white_label_tenants")
    .insert(payload)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ item: data });
}
