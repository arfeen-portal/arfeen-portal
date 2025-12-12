import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest, context: any) {
  // 🔹 Next 16 safe params access
  const { params } = context;
  const journeyId = params.id;

  // 🔹 Supabase client (ONLY ONCE)
  const supabase = await createClient();

  // 🔹 RPC call
  const { data, error } = await supabase.rpc(
    "spiritual_summary_for_journey",
    {
      p_journey_id: journeyId,
    }
  );

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({
    summary: data,
  });
}
