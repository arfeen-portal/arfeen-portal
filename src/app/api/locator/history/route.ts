// src/app/api/locator/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();

  const searchParams = req.nextUrl.searchParams;
  const profileId = searchParams.get("profile_id");

  if (!profileId) {
    return NextResponse.json(
      { error: "profile_id is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("locator_history")
    .select("*")
    .eq("profile_id", profileId)
    .order("timestamp", { ascending: false })
    .limit(500);

  if (error) {
    console.error("history error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
