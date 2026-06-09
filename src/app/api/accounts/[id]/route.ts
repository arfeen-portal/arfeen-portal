import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type AccountType = "asset" | "liability" | "equity" | "income" | "expense";
type NormalSide = "debit" | "credit";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRole) {
    return null;
  }

  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function inferNormalSide(accountType: AccountType): NormalSide {
  if (accountType === "asset" || accountType === "expense") return "debit";
  return "credit";
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: "Missing Supabase environment variables." },
        { status: 500 }
      );
    }

    const { id } = await context.params;

    const { data, error } = await supabase
      .from("accounts")
      .select(
        `
          id,
          code,
          name,
          account_type,
          category,
          normal_side,
          parent_id,
          opening_balance,
          currency,
          description,
          is_active,
          is_system,
          created_at,
          updated_at,
          parent:parent_id (
            id,
            code,
            name
          )
        `
      )
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch account." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: "Missing Supabase environment variables." },
        { status: 500 }
      );
    }

    const { id } = await context.params;
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

    if (!code) {
      return NextResponse.json({ error: "Account code is required." }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: "Account name is required." }, { status: 400 });
    }

    if (!account_type) {
      return NextResponse.json({ error: "Account type is required." }, { status: 400 });
    }

    if (parent_id && parent_id === id) {
      return NextResponse.json(
        { error: "An account cannot be its own parent." },
        { status: 400 }
      );
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
      currency: currency || "PKR",
      description,
      is_active,
    };

    const { data, error } = await supabase
      .from("accounts")
      .update(payload)
      .eq("id", id)
      .select(
        `
          id,
          code,
          name,
          account_type,
          category,
          normal_side,
          parent_id,
          opening_balance,
          currency,
          description,
          is_active,
          is_system,
          updated_at
        `
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to update account." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: "Missing Supabase environment variables." },
        { status: 500 }
      );
    }

    const { id } = await context.params;

    const { count: childCount, error: childError } = await supabase
      .from("accounts")
      .select("*", { count: "exact", head: true })
      .eq("parent_id", id);

    if (childError) {
      return NextResponse.json({ error: childError.message }, { status: 400 });
    }

    if ((childCount || 0) > 0) {
      return NextResponse.json(
        { error: "Cannot delete this account because child accounts exist." },
        { status: 400 }
      );
    }

    const { count: lineCount, error: lineError } = await supabase
      .from("accounting_voucher_lines")
      .select("*", { count: "exact", head: true })
      .eq("account_id", id);

    if (lineError) {
      return NextResponse.json({ error: lineError.message }, { status: 400 });
    }

    if ((lineCount || 0) > 0) {
      return NextResponse.json(
        { error: "Cannot delete this account because voucher transactions exist." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("accounts").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to delete account." },
      { status: 500 }
    );
  }
}