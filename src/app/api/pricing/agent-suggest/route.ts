import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
export const dynamic = "force-dynamic";

type Body = {
  basePrice: number;
  agentId: string; // UUID
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const supabase = getSupabaseServerClient();

    const { data: rule } = await supabase
      .from('agent_pricing_rules')
      .select('*')
      .eq('agent_id', body.agentId)
      .maybeSingle();

    const base = body.basePrice;

    const markup = rule?.markup_percent ?? 0;
    const minMargin = rule?.min_margin ?? 0;
    const maxDiscount = rule?.max_discount_percent ?? 20;

    const minPrice = base * (1 - maxDiscount / 100);
    const cheapest = Math.round(Math.max(minPrice, base * 0.95));

    let recommended = Math.round(base * (1 + markup / 100));
    if (recommended - base < minMargin) {
      recommended = base + minMargin;
    }

    const vip = Math.round(recommended * 1.25);

    return NextResponse.json({
      success: true,
      suggestions: {
        cheapest: {
          label: 'Cheapest allowed',
          price: cheapest,
          note: `Max ${maxDiscount}% tak discount allowed.`
        },
        recommended: {
          label: 'Agent Recommended',
          price: recommended,
          note: `Markup ${markup}% with minimum margin ${minMargin} SAR.`
        },
        vip: {
          label: 'VIP High Margin',
          price: vip,
          note: 'Best option for premium clients.'
        }
      }
    });
  } catch (error: any) {
    console.error('Agent pricing error', error);
    return NextResponse.json(
      { success: false, error: error.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
