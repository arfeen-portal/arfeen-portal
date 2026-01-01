import { NextRequest, NextResponse } from 'next/server';
// baaki tumhare imports yahan rahen (createAdminClient, etc.)
export const dynamic = "force-dynamic";
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 👈 naya tareeqa: params ko await karo
  const { id } = await params;

  // ↓ yahan se neeche tumhara purana logic as-is rakh sakte ho
  // example:
  /*
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('hotel_prayer_halls')
    .select('*')
    .eq('hotel_id', id);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch prayer halls' }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 200 });
  */
}
