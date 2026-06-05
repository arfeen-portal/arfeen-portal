import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase admin client is not configured." },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from("acc_accounts")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, row: data });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unexpected server error." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase admin client is not configured." },
        { status: 500 }
      );
    }

    const body = await req.json();

    const payload = {
      code: String(body.code || "").trim(),
      name: String(body.name || "").trim(),
      group_id: body.group_id || null,
      currency_code: body.currency_code || "PKR",
      is_active: body.is_active ?? true,
    };

    if (!payload.code || !payload.name || !payload.group_id) {
      return NextResponse.json(
        { ok: false, error: "Code, account name, and group are required." },
        { status: 400 }
      );
    }

    const { data: existing, error: existingError } = await supabase
      .from("acc_accounts")
      .select("id")
      .eq("code", payload.code)
      .neq("id", params.id)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { ok: false, error: existingError.message },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Another account already uses this code." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("acc_accounts")
      .update(payload)
      .eq("id", params.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, row: data });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unexpected server error." },
      { status: 500 }
    );
  }
}