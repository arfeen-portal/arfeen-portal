import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const serverClient = () =>
  createClient<any>(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });

export async function GET(req: NextRequest) {
  try {
    const supabase = serverClient();

    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .slice(0, 10);

    // Total unpaid
    const { data: unpaidAgg } = await supabase
      .from('invoices')
      .select('total_billing')
      .in('status', ['sent', 'partially_paid']);

    const totalUnpaid = (unpaidAgg || []).reduce(
      (sum: number, row: any) => sum + Number(row.total_billing || 0),
      0
    );

    // Total overdue
    const { data: overdueAgg } = await supabase
      .from('invoices')
      .select('total_billing')
      .in('status', ['sent', 'partially_paid'])
      .lt('due_date', today.toISOString().slice(0, 10));

    const totalOverdue = (overdueAgg || []).reduce(
      (sum: number, row: any) => sum + Number(row.total_billing || 0),
      0
    );

    // This month collected (payments captured)
    const { data: paymentsAgg } = await supabase
      .from('payments')
      .select('amount, paid_at, currency')
      .eq('status', 'captured')
      .gte('paid_at', monthStart);

    const thisMonthCollected = (paymentsAgg || []).reduce(
      (sum: number, row: any) => sum + Number(row.amount || 0),
      0
    );

    // Upcoming 7 days due
    const sevenDaysAhead = new Date(
      today.getTime() + 7 * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .slice(0, 10);

    const { data: upcomingInv } = await supabase
      .from('invoices')
      .select('id')
      .in('status', ['sent', 'partially_paid'])
      .gte('due_date', today.toISOString().slice(0, 10))
      .lte('due_date', sevenDaysAhead);

    const upcomingCount = (upcomingInv || []).length;

    return NextResponse.json(
      {
        totalUnpaid,
        totalOverdue,
        thisMonthCollected,
        upcomingCount
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
