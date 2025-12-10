import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient();

  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { name, start_date, end_date } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("groups")
    .insert({
      name,
      start_date: start_date || null,
      end_date: end_date || null,
      created_by: user.id,
      // tenant_id: Yahan baad me aap apni multi-tenant logic laga sakte ho
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Failed to create group" },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: data.id });
}
