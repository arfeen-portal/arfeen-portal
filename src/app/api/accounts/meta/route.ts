import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    success: true,
    meta: {
      module: "Accounting",
      status: "ready",
      features: ["journal", "ledger", "trial_balance", "aging", "vouchers", "profit_loss"],
    },
  });
}
