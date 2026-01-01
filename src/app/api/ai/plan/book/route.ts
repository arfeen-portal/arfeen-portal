import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export const dynamic = "force-dynamic";

type PlanSummary = {
  nights: number;
  totalBudget: number;
  perNightBudget: number;
  hotelCategory: string;
  transport: string;
};

type PlannerPlan = {
  summary: PlanSummary;
  recommendedHotels: any[];
  transportSuggestion: any;
  ziyaratPlan: any[];
};

type BookRequestBody = {
  plan: PlannerPlan;
  customer: {
    fullName: string;
    phone: string;
    email?: string;
  };
  source?: 'b2c' | 'b2b' | 'public_landing';
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BookRequestBody;
    const supabase = getSupabaseServerClient();

    const {
      data: { user }
    } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

    if (!body.customer?.fullName || !body.customer?.phone) {
      return NextResponse.json(
        { success: false, error: 'Customer name aur phone required hain.' },
        { status: 400 }
      );
    }

    if (!body.plan?.summary) {
      return NextResponse.json(
        { success: false, error: 'Plan summary missing.' },
        { status: 400 }
      );
    }

    const totalPrice = body.plan.summary.totalBudget || 0;

    // TODO: Yahan apni main booking table ka naam aur columns match kar lena agar different hon.
    const { data, error } = await supabase
      .from('bookings') // <- agar aapka naam 'bookings' ke ilawa kuch aur hai to yahan change karein
      .insert({
        user_id: user?.id ?? null, // ya agent_id etc.
        customer_name: body.customer.fullName,
        customer_phone: body.customer.phone,
        customer_email: body.customer.email || null,
        total_price: totalPrice,
        status: 'pending',
        source: body.source || 'ai_planner',
        meta: {
          ai_plan: body.plan
        }
      })
      .select('id')
      .single();

    if (error) throw error;

    const wTemplate = `
🕋 *Umrah Travel Plan (Auto-Generated)*

👤 *Name:* ${body.customer.fullName}
📞 *Phone:* ${body.customer.phone}

🏨 *Hotel:* ${body.plan.summary.hotelCategory}
🚗 *Transport:* ${body.plan.summary.transport}

💰 *Estimated Total:* ${body.plan.summary.totalBudget} SAR
🕒 *Nights:* ${body.plan.summary.nights}

🔗 Confirm Booking:
https://portal.arfeentravel.com/booking/${data.id}

_JazakAllah — Arfeen Travel_
    `.trim();

    return NextResponse.json({
      success: true,
      bookingId: data.id,
      whatsappTemplate: wTemplate,
      message: 'Booking draft created from AI plan.'
    });
  } catch (error: any) {
    console.error('AI Plan book error', error);
    return NextResponse.json(
      { success: false, error: error.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
