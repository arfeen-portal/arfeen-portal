import { NextResponse, NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const response = {
      todayBookings: 0,
      transportBookings: 0,
      hotelBookings: 0,
      agentsLedger: 0,
      revenueLast7Days: [],
      topRoutes: [],
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
