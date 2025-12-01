import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// server-side supabase client (service role, koi RLS problem nahi)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// POST /api/umrah-groups  -> naya group + flight save
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1) main group insert
    const { data: group, error: groupError } = await supabase
      .from('umrah_groups')
      .insert({
        airline: body.airlineId,
        sector_from: body.sectorFrom,
        sector_to: body.sectorTo,
        cabin_class: body.cabinClass,
        type: body.type,
        group_name: body.groupName,
        group_code: body.groupCode,
        days: body.days || null,
        seats: body.seats || null,
        show_seats: body.showSeats ?? true,

        buying_currency: body.buyingCurrency,
        buying_adult: body.buyingAdult,
        buying_child: body.buyingChild,
        buying_infant: body.buyingInfant,

        selling_currency_b2b: body.sellingCurrencyB2B,
        selling_adult_b2b: body.sellingAdultB2B,
        selling_child_b2b: body.sellingChildB2B,
        selling_infant_b2b: body.sellingInfantB2B,

        selling_currency_b2c: body.sellingCurrencyB2C,
        selling_adult_b2c: body.sellingAdultB2C,
        selling_child_b2c: body.sellingChildB2C,
        selling_infant_b2c: body.sellingInfantB2C,

        pnr: body.pnr,
        contact_phone: body.contactPhone,
        contact_email: body.contactEmail,
        internal_status: body.internalStatus,
      })
      .select()
      .single();

    if (groupError) {
      console.error('groupError', groupError);
      return NextResponse.json({ error: groupError.message }, { status: 400 });
    }

    // 2) flight leg insert
    const { error: flightError } = await supabase
      .from('umrah_group_flights')
      .insert({
        group_id: group.id,
        flight_no: body.flightNo,
        dep_date: body.depDate || null,
        dep_time: body.depTime || null,
        arr_date: body.arrDate || null,
        arr_time: body.arrTime || null,
        from_terminal: body.fromTerminal,
        to_terminal: body.toTerminal,
        baggage: body.baggage,
        meal: body.meal,
      });

    if (flightError) {
      console.error('flightError', flightError);
      return NextResponse.json(
        { error: flightError.message, groupId: group.id },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, group });
  } catch (err: any) {
    console.error('POST /umrah-groups error', err);
    return NextResponse.json(
      { error: 'Unexpected error while saving group' },
      { status: 500 },
    );
  }
}

// GET /api/umrah-groups  -> list with flights
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('umrah_groups')
      .select('*, umrah_group_flights(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getError', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('GET /umrah-groups error', err);
    return NextResponse.json(
      { error: 'Unexpected error while fetching groups' },
      { status: 500 },
    );
  }
}
