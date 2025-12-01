// src/app/api/dashboard/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
// agar tum supabase use karna chaho to ye line rakho
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    // Abhi ke liye basic stub data bhej rahe hain
    // Baad me yahan supabase se real data laa sakte hain

    // const supabase = createClient();
    // const { data, error } = await supabase
    //   .from("your_dashboard_view")
    //   .select("*");
    // if (error) {
    //   console.error("Dashboard summary DB error", error);
    //   return NextResponse.json({ error: "Database error" }, { status: 500 });
    // }

    const response = {
      todayBookings: 0,
      transportBookings: 0,
      hotelBookings: 0,
      agentsLedger: 0,
      revenueLast7Days: [], // [{ date: "...", amount: 0 }, ...]
      topRoutes: []         // [{ route: "JED → Makkah", count: 0 }, ...]
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Dashboard summary API error", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// IMPORTANT:
// Is file me kahin bhi `export default` NAHI hona chahiye.
