// src/app/admin/api/locator/meetup/list/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminClient();

  if (!supabase) {
    return NextResponse.json(
      { success: false, meetups: [], message: "Supabase env missing/invalid on Vercel." },
      { status: 500 }
    );
  }

  // ⚠️ Table name apne actual table ke mutabiq change karna
  const { data, error } = await supabase
    .from("locator_meetups")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { success: false, meetups: [], message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, meetups: data ?? [], message: "OK" }, { status: 200 });
}
