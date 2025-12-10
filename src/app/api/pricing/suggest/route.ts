import { NextRequest, NextResponse } from 'next/server';

type SuggestPricingInput = {
  basePrice: number;       // e.g. rate engine se aane wala base total
  demandIndex?: number;    // 1–10 (higher = more demand)
  occupancy?: 'low' | 'medium' | 'high';
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SuggestPricingInput;
    const base = body.basePrice;

    const demand = body.demandIndex ?? 5;
    const occupancy = body.occupancy ?? 'medium';

    // Cheap: thoda discount
    const cheapest = Math.round(base * 0.95);

    // Recommended: base + slight mark-up on high demand
    const demandFactor = demand > 7 ? 1.08 : demand < 4 ? 0.98 : 1.03;
    const recommended = Math.round(base * demandFactor);

    // VIP: 20–30% premium, extra up if high occupancy
    const occFactor = occupancy === 'high' ? 1.3 : occupancy === 'medium' ? 1.25 : 1.2;
    const vip = Math.round(base * occFactor);

    const result = {
      cheapest: {
        label: 'Cheapest',
        price: cheapest,
        note: 'Price-focused option, limited flexibility.'
      },
      recommended: {
        label: 'Recommended',
        price: recommended,
        note: 'Balanced between comfort and budget.'
      },
      vip: {
        label: 'VIP Comfort',
        price: vip,
        note: 'Best comfort, flexible change options (ideal for families / VIP).'
      }
    };

    return NextResponse.json({ success: true, suggestions: result });
  } catch (error: any) {
    console.error('Suggestive pricing error', error);
    return NextResponse.json(
      { success: false, error: error.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
