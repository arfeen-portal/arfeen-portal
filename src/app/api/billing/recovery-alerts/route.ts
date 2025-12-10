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

    const { data, error } = await supabase
      .from('recovery_alerts')
      .select('*')
      .order('service_date', { ascending: true });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: 'Failed to load alerts' }, { status: 500 });
    }

    return NextResponse.json({ alerts: data || [] }, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
