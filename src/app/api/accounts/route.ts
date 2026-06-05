import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type AccountType = "asset" | "liability" | "equity" | "income" | "expense";
type NormalSide = "debit" | "credit";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) return null;

  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function inferNormalSide(accountType: AccountType): NormalSide {
  if (accountType === "asset" || accountType === "expense") return "debit";
  return "credit";
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Missing Supabase environment variables." }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";
    const type = searchParams.get("type")?.trim() || "";
    const active = searchParams.get("active")?.trim() || "";

    let query = supabase
      .from("accounts")
      .select(`
        id, code, name, account_type, category, normal_side, parent_id,
        opening_balance, currency, description, is_active, is_system, created_at, updated_at,
        parent:parent_id (id, code, name)
      `)
      .order("code", { ascending: true });

    if (q) {
      query = query.or(`code.ilike.%${q}%,name.ilike.%${q}%,category.ilike.%${q}%,description.ilike.%${q}%`);
    }

    if (type) {
      query = query.eq("account_type", type);
    }

    if (active === "true") {
      query = query.eq("is_active", true);
    } else if (active === "false") {
      query = query.eq("is_active", false);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ data: data || [] }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch accounts." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Missing Supabase environment variables." }, { status: 500 });
    }

    const body = await req.json();

    const code = String(body?.code || "").trim();
    const name = String(body?.name || "").trim();
    const account_type = String(body?.account_type || "").trim() as AccountType;
    const category = String(body?.category || "").trim();
    const normal_side = String(body?.normal_side || "").trim() as NormalSide;
    const parent_id = body?.parent_id ? String(body.parent_id) : null;
    const opening_balance = Number(body?.opening_balance || 0);
    const currency = String(body?.currency || "PKR").trim().toUpperCase();
    const description = body?.description ? String(body.description).trim() : null;
    const is_active = Boolean(body?.is_active ?? true);

    // Validations
    if (!code) return NextResponse.json({ error: "Account code is required." }, { status: 400 });
    if (!name) return NextResponse.json({ error: "Account name is required." }, { status: 400 });
    if (!account_type) return NextResponse.json({ error: "Account type is required." }, { status: 400 });

    // IMPROVEMENT 1: Check if account code already exists to prevent duplicate runtime anomaly
    const { data: existingAccount } = await supabase
      .from("accounts")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (existingAccount) {
      return NextResponse.json({ error: `Account code '${code}' pehle se register hai.` }, { status: 400 });
    }

    const finalNormalSide =
      normal_side === "debit" || normal_side === "credit"
        ? normal_side
        : inferNormalSide(account_type);

    const payload = {
      code,
      name,
      account_type,
      category,
      normal_side: finalNormalSide,
      parent_id,
      opening_balance: Number.isFinite(opening_balance) ? opening_balance : 0,
      currency,
      description,
      is_active,
      is_system: false, // IMPROVEMENT 2: Strictly lock down system account flag generation from user APIs
    };

    const { data, error } = await supabase
      .from("accounts")
      .insert([payload])
      .select(`
        id, code, name, account_type, category, normal_side, parent_id,
        opening_balance, currency, description, is_active, is_system
      `)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create account." }, { status: 500 });
  }
}