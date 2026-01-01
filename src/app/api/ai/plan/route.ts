import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export const dynamic = "force-dynamic";

type PlannerInput = {
  role?: 'customer' | 'agent';
  dates: { checkin: string; checkout: string };
  budget: number;
  cityPreference?: 'near_haram' | 'budget' | 'vip';
  groupType?: 'solo' | 'family' | 'group';
};

function diffDays(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const ms = e.getTime() - s.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PlannerInput;
    const nights = diffDays(body.dates.checkin, body.dates.checkout);
    const perNightBudget = body.budget / nights;

    // Simple heuristic-based suggestion (no old tables required)
    const hotelCategory =
      body.cityPreference === 'vip'
        ? '5-star near Haram'
        : body.cityPreference === 'budget'
        ? '3-star slightly away'
        : '4-star walking distance';

    const transport =
      body.groupType === 'family' || body.groupType === 'group'
        ? 'Private Van / GMC'
        : 'Economy Car or Shared Shuttle';

    const plan = {
      summary: {
        nights,
        totalBudget: body.budget,
        perNightBudget: Math.round(perNightBudget),
        hotelCategory,
        transport
      },
      recommendedHotels: [
        {
          city: 'Makkah',
          label:
            body.cityPreference === 'vip'
              ? 'VIP 5★ near Haram (Example)'
              : 'Comfort 4★ near Haram (Example)',
          approxPricePerNight: Math.round(perNightBudget * 0.6),
          distanceNote:
            body.cityPreference === 'budget'
              ? '800–1200m from Haram'
              : '200–500m from Haram'
        },
        {
          city: 'Madinah',
          label: 'Comfort 4★ near Masjid Nabawi (Example)',
          approxPricePerNight: Math.round(perNightBudget * 0.4)
        }
      ],
      transportSuggestion: {
        type: transport,
        note:
          body.groupType === 'family'
            ? 'Family-friendly with enough luggage space.'
            : 'Economy + easy on budget.'
      },
      ziyaratPlan: [
        {
          city: 'Makkah',
          when: 'Day 2 (after Asr)',
          note: 'Hudaibiya, Jabal Noor, Jabal Thawr, Mina, Arafat'
        },
        {
          city: 'Madinah',
          when: 'Day 5 (after Asr)',
          note: 'Uhud, Quba, Qiblatain, Sabaa Masajid'
        }
      ]
    };

    const supabase = getSupabaseServerClient();

    const {
      data: { user }
    } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

    if (user) {
      await supabase.from('ai_recommendations').insert({
        user_id: user.id,
        role: body.role ?? 'customer',
        input_json: body,
        generated_plan: plan,
        score: 0.9
      });
    }

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    console.error('AI Planner error', error);
    return NextResponse.json(
      { success: false, error: error.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
