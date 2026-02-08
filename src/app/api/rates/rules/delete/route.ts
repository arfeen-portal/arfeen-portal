import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    const supabase = createSupabaseServerClient();

    const { error } = await supabase
      .from("rate_rules")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("rate_rules/delete error", error);
      return NextResponse.json(
        { error: "Failed to delete rule", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("rate_rules/delete exception", err);
    return NextResponse.json(
      { error: "Server error", details: err.message ?? String(err) },
      { status: 500 }
    );
  }
}
