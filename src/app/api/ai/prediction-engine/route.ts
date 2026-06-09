import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    success: true,
    predictions: [
      {
        id: "p1",
        title: "Makkah package demand expected to rise",
        category: "Umrah Demand",
        confidence: 91,
        impact: "High",
        recommendation:
          "Prepare Quad and Triple package pricing for next 14 days. Keep hotel inventory locked early.",
      },
      {
        id: "p2",
        title: "Agent payment delay risk",
        category: "Credit Control",
        confidence: 84,
        impact: "Medium",
        recommendation:
          "Limit credit exposure for agents with delayed settlement history and activate balance reminders.",
      },
      {
        id: "p3",
        title: "Jeddah arrival transport pressure",
        category: "Transport",
        confidence: 78,
        impact: "Medium",
        recommendation:
          "Keep backup drivers ready for evening arrivals and VIP family bookings.",
      },
    ],
  });
}