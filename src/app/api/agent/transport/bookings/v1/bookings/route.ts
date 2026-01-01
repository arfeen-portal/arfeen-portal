import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = "force-dynamic";

async function getAgentFromApiKey(req: Request, supabase: any) {
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey) return null;

  const { data, error } = await supabase
    .from('agent_api_keys')
    .select('agent_id, is_active')
    .eq('api_key', apiKey)
    .maybeSingle();

  if (error || !data || !data.is_active) return null;
  return data.agent_id as string;
}

// Decide commission % for this agent (rule, else default)
async function resolveCommissionPercent(
  supabase: any,
  agentId: string
): Promise<number> {
  // 1) Check agent-specific rules
  const today = new Date().toISOString().slice(0, 10);

  const { data: rules, error: rulesError } = await supabase
    .from('agent_commission_rules')
    .select('commission_type, commission_value')
    .eq('agent_id', agentId)
    .eq('product_type', 'transport')
    .lte('valid_from', today)
    .or('valid_to.is.null,valid_to.gte.' + today)
    .order('valid_from', { ascending: false })
    .limit(1);

  if (!rulesError && rules && rules.length > 0) {
    const rule = rules[0];
    if (rule.commission_type === 'percent') {
      return Number(rule.commission_value) || 0;
    }
    // flat value wale case mein % nahi, flat hi apply karenge (neeche)
    return -1 * Number(rule.commission_value || 0); // negative -> use flat
  }

  // 2) Otherwise default_commission from agents table
  const { data: agent, error: agentErr } = await supabase
    .from('agents')
    .select('default_commission')
    .eq('id', agentId)
    .maybeSingle();

  if (!agentErr && agent && agent.default_commission != null) {
    return Number(agent.default_commission) || 0;
  }

  // 0% by default
  return 0;
}

export async function POST(req: Request) {
  const supabase = createClient();
  const agentId = await getAgentFromApiKey(req, supabase);

  if (!agentId) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  const body = await req.json();

  const {
    vehicle_id,
    from_city_id,
    to_city_id,
    travel_date,
    pax,
    // Baqi fields as-is payload mein chale jayenge
    ...rest
  } = body;

  if (!vehicle_id || !from_city_id || !to_city_id || !travel_date || !pax) {
    return NextResponse.json(
      { error: 'Missing required fields (vehicle/from/to/date/pax)' },
      { status: 400 }
    );
  }

  // 1) Rate Engine se price nikaalo
  const { data: rateData, error: rateError } = await supabase.rpc(
    'get_transport_rate',
    {
      p_vehicle: vehicle_id,
      p_from: from_city_id,
      p_to: to_city_id,
      p_date: travel_date,
      p_pax: pax,
      p_agent: agentId,
    }
  );

  if (rateError) {
    console.error('rate error', rateError);
    return NextResponse.json(
      { error: 'Failed to calculate rate' },
      { status: 500 }
    );
  }

  const price = Number(rateData || 0);

  // 2) Commission % / flat
  const percentOrFlat = await resolveCommissionPercent(supabase, agentId);

  let agentCommission = 0;
  let agentCommissionPercent = 0;

  if (percentOrFlat < 0) {
    // flat rule
    agentCommission = Math.abs(percentOrFlat);
    agentCommissionPercent =
      price > 0 ? (agentCommission / price) * 100.0 : 0;
  } else {
    // percent rule
    agentCommissionPercent = percentOrFlat;
    agentCommission = (price * agentCommissionPercent) / 100.0;
  }

  // 3) Booking insert
  const payload: any = {
    agent_id: agentId,
    vehicle_id,
    from_city_id,
    to_city_id,
    travel_date,
    pax,
    rate_price: price,
    agent_commission: agentCommission,
    agent_commission_percent: agentCommissionPercent,
    ...rest, // customer_name, phone, notes, etc.
  };

  const { data: booking, error: insertError } = await supabase
    .from('transport_bookings')
    .insert([payload])
    .select()
    .single();

  if (insertError) {
    console.error('insert error', insertError);
    return NextResponse.json(
      { error: 'Booking failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({ booking });
}
