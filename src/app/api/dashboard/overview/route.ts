// src/app/api/dashboard/overview/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
const supabase = createSupabaseServerClient();

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    

    // Agar tumhein query string chahiye to yahan se lo:
    // const { searchParams } = new URL(req.url);
    // const agentId = searchParams.get("agentId");

    // Yahan tumhara actual Supabase logic:
    const { data: bookings, error } = await supabase
      .from("dashboard_bookings_view")
      .select("*");

    if (error) {
      console.error("Dashboard query error", error);
      return NextResponse.json(
        { error: "Database error" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        bookings,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Dashboard GET error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Agar POST bhi chahiye ho to yeh pattern use karo:
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: "Invalid or empty JSON body" },
        { status: 400 }
      );
    }

    // yahan body se data use karo
    // const { fromDate, toDate } = body;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Dashboard POST error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
