import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export async function GET() {
  const supabase = getSupabaseAdminSafe();

  const { data } = await supabase!.from("system_settings").select("*");
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const supabase = getSupabaseAdminSafe();

  const { data, error } = await supabase!
    .from("system_settings")
    .upsert([{ key: body.key, value: body.value }]);

  return NextResponse.json({ data, error });
}