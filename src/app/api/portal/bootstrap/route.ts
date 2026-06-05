import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const supabaseAdminClient = supabaseAdmin;

    const hostHeader = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
    const host = hostHeader.split(":")[0].toLowerCase().trim();

    if (!host) {
      return NextResponse.json({ error: "Host not found" }, { status: 400 });
    }

    const { data, error } = await supabaseAdminClient
      .from("v_portal_host_resolution")
      .select("*")
      .eq("domain", host)
      .eq("domain_active", true)
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      host,
      branding: data ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load portal bootstrap" },
      { status: 500 }
    );
  }
}