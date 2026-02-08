import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();

  const {
    userId,
    purpose, // "umrah" | "ziyarah" | "tourism"
    startDate,
    endDate,
    preferences,
  } = body;

  // 🔴 pehle: 
  const supabase = createSupabaseServerClient();


  // TODO: yahan AI se real segments banwane hain – abhi fake example:
  const fakeSegments = [
    {
      segment_type: 'flight',
      from_slug: 'khi-airport',
      to_slug: 'jeddah-airport',
      start_at: startDate,
      end_at: null,
      meta: { airline: 'PK', flight_no: 'PK123' },
    },
  ];

  // 1) Journey create
  const { data: journey, error: jErr } = await supabase
    .from('journeys')
    .insert({
      user_id: userId,
      purpose,
      start_at: startDate,
      end_at: endDate,
      preferences,
      title: `${String(purpose).toUpperCase()} Journey`,
    })
    .select('*')
    .single();

  if (jErr || !journey) {
    return NextResponse.json({ error: jErr?.message }, { status: 400 });
  }

  // 2) Places fetch by slug
 const slugs = Array.from(
  new Set(
    fakeSegments
      .map((s) => s.from_slug)
      .concat(fakeSegments.map((s) => s.to_slug))
  )
);


  const { data: places } = await supabase
    .from('places')
    .select('id, slug')
    .in('slug', slugs);

  const slugMap = new Map<string, string>();
  (places ?? []).forEach((p) => slugMap.set(p.slug, p.id));

  const segmentsToInsert = fakeSegments.map((s, idx) => ({
    journey_id: journey.id,
    sort_order: idx + 1,
    segment_type: s.segment_type,
    from_place_id: s.from_slug ? slugMap.get(s.from_slug) : null,
    to_place_id: s.to_slug ? slugMap.get(s.to_slug) : null,
    start_at: s.start_at,
    end_at: s.end_at,
    meta: s.meta,
  }));

  const { error: segErr } = await supabase
    .from('journey_segments')
    .insert(segmentsToInsert);

  if (segErr) {
    return NextResponse.json(
      { error: segErr.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ journey_id: journey.id });
}
