import { NextRequest, NextResponse } from "next/server";

const BASE_PER_KM: Record<string, number> = {
  sedan: 2.5,      // example SAR/km
  hiace: 3.0,
  coaster: 3.5,
  gmc: 4.0,
};

export async function POST(req: NextRequest) {
  try {
    const { vehicle_type, distance_km, base_fare_manual, agent_commission_percent, profit_percent } =
      await req.json();

    const distance = Number(distance_km ?? 0);

    // base price from map OR manual override
    let basePerKm = BASE_PER_KM[vehicle_type] ?? 3.0;
    let baseFare = basePerKm * distance;

    if (base_fare_manual && Number(base_fare_manual) > 0) {
      baseFare = Number(base_fare_manual);
    }

    const agentCommissionPct = Number(agent_commission_percent ?? 0); // e.g. 10
    const profitPct = Number(profit_percent ?? 0);                     // e.g. 15

    const agentCommissionAmount = (baseFare * agentCommissionPct) / 100;
    const profitAmount = (baseFare * profitPct) / 100;
    const totalPrice = baseFare + profitAmount; // commission aapka structure ke mutabiq change ho sakta

    return NextResponse.json({
      base_fare: Number(baseFare.toFixed(2)),
      agent_commission: Number(agentCommissionAmount.toFixed(2)),
      total_price: Number(totalPrice.toFixed(2)),
    });
  } catch (err: any) {
    console.error("rate-quote exception", err);
    return NextResponse.json(
      { error: "Server error", details: err.message ?? String(err) },
      { status: 500 }
    );
  }
}
