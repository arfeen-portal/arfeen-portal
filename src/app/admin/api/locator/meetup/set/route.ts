// src/app/admin/api/locator/meetup/set/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const supabase = createAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { success: false, message: "Supabase env missing/invalid (check NEXT_PUBLIC_SUPABASE_URL + keys)." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));

  // TODO: apne columns/table ke mutabiq adjust kar lena
  const { data, error } = await supabase
    .from("locator_meetups")
    .insert([body])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, meetup: data }, { status: 200 });
}
