import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const service = searchParams.get("service") || "transport";

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("rate_rules")
      .select("*")
      .eq("service_type", service)
      .order("priority", { ascending: true });

    if (error) {
      console.error("rate_rules/list error", error);
      return NextResponse.json(
        { error: "Failed to fetch rules", details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ rules: data ?? [] });
  } catch (err: any) {
    console.error("rate_rules/list exception", err);
    return NextResponse.json(
      { error: "Server error", details: err.message ?? String(err) },
      { status: 500 }
    );
  }
}
