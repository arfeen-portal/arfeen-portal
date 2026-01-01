import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    // AI plans count
    const { count: totalPlans } = await supabase
      .from('ai_recommendations')
      .select('*', { count: 'exact', head: true });

    // AI chat sessions
    const { count: totalSessions } = await supabase
      .from('ai_chat_sessions')
      .select('*', { count: 'exact', head: true });

    // Last 10 plans
    const { data: lastPlans } = await supabase
      .from('ai_recommendations')
      .select('id, created_at, input_json, generated_plan')
      .order('created_at', { ascending: false })
      .limit(10);

    // AI source bookings
    const { count: aiBookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'ai_planner');

    return NextResponse.json({
      success: true,
      stats: {
        totalPlans: totalPlans ?? 0,
        totalSessions: totalSessions ?? 0,
        aiBookings: aiBookings ?? 0
      },
      lastPlans: lastPlans ?? []
    });
  } catch (error: any) {
    console.error('Admin AI analytics error', error);
    return NextResponse.json(
      { success: false, error: error.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
