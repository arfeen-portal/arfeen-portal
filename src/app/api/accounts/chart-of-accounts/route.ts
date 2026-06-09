import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase admin client is not configured." },
        { status: 500 }
      );
    }

    const search = req.nextUrl.searchParams.get("search")?.trim() || "";

    let query = supabase
      .from("acc_accounts")
      .select(`
        id,
        code,
        name,
        group_id,
        currency_code,
        is_active,
        created_at,
        group:acc_account_groups(
          id,
          name,
          type
        )
      `)
      .order("code", { ascending: true });

    if (search) {
      query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, rows: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unexpected server error." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { ok: false, error: existingError.message },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Account code already exists." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("acc_accounts")
      .insert([payload])
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