// src/app/api/transport/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase";

// Example handler: create a transport order
export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const payload = await req.json();

    // Make sure table exists: public.transport_orders
    const { data, error } = await supabase
      .from("transport_orders")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
