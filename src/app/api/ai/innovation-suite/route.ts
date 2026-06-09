import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    success: true,
    metrics: [],
    modules: [
      {
        id: "m1",
        name: "Real-Time Umrah Market Exchange",
        category: "Marketplace AI",
        status: "Active",
        score: 94,
        priority: "High",
        impact: "Inventory exchange, group seats, visa slots, and hotel sharing.",
        description:
          "Creates a B2B marketplace layer where agents can exchange/sell travel inventory inside your portal.",
      },
      {
        id: "m2",
        name: "AI Staff Performance Truth Engine",
        category: "AI Operations",
        status: "Active",
        score: 91,
        priority: "High",
        impact: "Detects productivity gaps, suspicious behavior, and refund abuse.",
        description:
          "Analyzes booking activity, refunds, delays, follow-ups, and sales conversion to reveal real staff performance.",
      },
      {
        id: "m3",
        name: "Pilgrim Emotion Analytics",
        category: "AI Experience",
        status: "Planning",
        score: 87,
        priority: "Medium",
        impact: "Tracks anger, satisfaction, urgency, stress, and trust signals.",
        description:
          "Reads feedback and WhatsApp tone patterns to protect pilgrim experience before complaints become serious.",
      },
      {
        id: "m4",
        name: "AI Self-Healing Accounting",
        category: "Accounting AI",
        status: "Active",
        score: 96,
        priority: "Critical",
        impact: "Auto-detects duplicate vouchers, mismatches, and missing postings.",
        description:
          "Prevents accounting damage by identifying suspicious ledgers, wrong mappings, and reconciliation issues.",
      },
    ],
    alerts: [
      {
        id: "a1",
        title: "Refund anomaly pattern detected",
        severity: "High",
        detail:
          "Some refund behavior looks unusual. Review employee-wise and supplier-wise refund ratios.",
      },
      {
        id: "a2",
        title: "Supplier settlement delay risk",
        severity: "Medium",
        detail:
          "A few supplier balances may require reconciliation before closing period.",
      },
    ],
  });
}