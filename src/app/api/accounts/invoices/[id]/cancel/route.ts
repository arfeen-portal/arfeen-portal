import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function getAuthUser() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      user: null,
      error: "Supabase public environment variables are missing.",
    };
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Safe no-op for server contexts where cookies cannot be mutated.
        }
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      error: "Unauthorized token or profile session expired.",
    };
  }

  return { user, error: null };
}

async function getTenantIdForUser(userId: string, userMetadataTenantId?: string | null) {
  const supabaseAdmin = getSupabaseAdminSafe();

  if (!supabaseAdmin) {
    return {
      tenantId: null,
      error: "Supabase admin client is not configured.",
    };
  }

  if (userMetadataTenantId && isUuid(userMetadataTenantId)) {
    return { tenantId: userMetadataTenantId, error: null };
  }

  const { data: profile, error } = await supabaseAdmin
    .from("users")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return {
      tenantId: null,
      error: error.message,
    };
  }

  if (!profile?.tenant_id) {
    return {
      tenantId: null,
      error: "Tenant context missing from session/profile.",
    };
  }

  return {
    tenantId: profile.tenant_id as string,
    error: null,
  };
}

async function isAccountingDateLocked(tenantId: string, entryDate: string) {
  const supabaseAdmin = getSupabaseAdminSafe();

  if (!supabaseAdmin) {
    return {
      locked: false,
      error: "Supabase admin client is not configured.",
    };
  }

  const { data, error } = await supabaseAdmin
    .from("accounting_period_locks")
    .select("id, lock_type, start_date, end_date, reason")
    .eq("tenant_id", tenantId)
    .lte("start_date", entryDate)
    .gte("end_date", entryDate)
    .limit(1)
    .maybeSingle();

  if (error) {
    const msg = String(error.message || "");
    if (msg.includes("does not exist")) {
      return { locked: false, error: null };
    }

    return { locked: false, error: msg };
  }

  return {
    locked: Boolean(data?.id),
    error: null,
  };
}

function getInvoiceAmount(invoice: Record<string, any>) {
  return (
    Number(
      invoice.total_amount ??
        invoice.grand_total ??
        invoice.balance_amount ??
        invoice.subtotal ??
        0
    ) || 0
  );
}

function getInvoiceDate(invoice: Record<string, any>) {
  return String(
    invoice.invoice_date ||
      invoice.issue_date ||
      invoice.created_at ||
      new Date().toISOString()
  ).slice(0, 10);
}

async function findAccountIdByNames(
  tenantId: string,
  names: string[]
): Promise<string | null> {
  const supabaseAdmin = getSupabaseAdminSafe();

  if (!supabaseAdmin) return null;

  for (const name of names) {
    const { data } = await supabaseAdmin
      .from("chart_of_accounts")
      .select("id")
      .eq("tenant_id", tenantId)
      .ilike("name", `%${name}%`)
      .limit(1)
      .maybeSingle();

    if (data?.id) return data.id as string;
  }

  return null;
}

async function createReversalVoucher(params: {
  tenantId: string;
  invoiceId: string;
  invoiceNo: string | null;
  amount: number;
  reason: string;
  cancelledBy: string;
}) {
  const supabaseAdmin = getSupabaseAdminSafe();

  if (!supabaseAdmin) {
    return {
      reversalVoucherId: null,
      error: "Supabase admin client is not configured.",
    };
  }

  const {
    tenantId,
    invoiceId,
    invoiceNo,
    amount,
    reason,
    cancelledBy,
  } = params;

  const { data: reversalVoucher, error: reversalError } = await supabaseAdmin
    .from("finance_vouchers")
    .insert([
      {
        tenant_id: tenantId,
        voucher_type: "invoice_reversal",
        reference_type: "invoice",
        reference_id: invoiceId,
        voucher_no: `REV-${Date.now()}`,
        narration: `Invoice cancellation reversal${
          invoiceNo ? ` for ${invoiceNo}` : ""
        }. Reason: ${reason}`,
        status: "posted",
        total_debit: amount,
        total_credit: amount,
        created_by: cancelledBy,
        posted_at: new Date().toISOString(),
      },
    ])
    .select("id")
    .single();

  if (reversalError || !reversalVoucher?.id) {
    return {
      reversalVoucherId: null,
      error: reversalError?.message || "Failed to create reversal voucher.",
    };
  }

  const reversalVoucherId = reversalVoucher.id as string;

  const revenueAccountId = await findAccountIdByNames(tenantId, [
    "sales",
    "revenue",
    "income",
  ]);

  const receivableAccountId = await findAccountIdByNames(tenantId, [
    "receivable",
    "customer",
    "agent",
    "debtors",
  ]);

  if (revenueAccountId && receivableAccountId && amount > 0) {
    const { error: lineError } = await supabaseAdmin
      .from("finance_voucher_lines")
      .insert([
        {
          tenant_id: tenantId,
          voucher_id: reversalVoucherId,
          account_id: revenueAccountId,
          description: `Reverse sales/revenue for cancelled invoice${
            invoiceNo ? ` ${invoiceNo}` : ""
          }`,
          debit: amount,
          credit: 0,
        },
        {
          tenant_id: tenantId,
          voucher_id: reversalVoucherId,
          account_id: receivableAccountId,
          description: `Reverse customer receivable for cancelled invoice${
            invoiceNo ? ` ${invoiceNo}` : ""
          }`,
          debit: 0,
          credit: amount,
        },
      ]);

    if (lineError) {
      return {
        reversalVoucherId,
        error: `Reversal voucher created but voucher lines failed: ${lineError.message}`,
      };
    }
  }

  return {
    reversalVoucherId,
    error: null,
  };
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const supabaseAdmin = getSupabaseAdminSafe();

    if (!supabaseAdmin) {
      return jsonError("Supabase admin client is not configured.", 500);
    }

    const { user, error: authError } = await getAuthUser();

    if (authError || !user) {
      return jsonError(authError || "Unauthorized.", 401);
    }

    const { tenantId, error: tenantError } = await getTenantIdForUser(
      user.id,
      typeof user.user_metadata?.tenant_id === "string"
        ? user.user_metadata.tenant_id
        : null
    );

    if (tenantError || !tenantId) {
      return jsonError(tenantError || "Tenant context missing.", 403);
    }

    const { id } = await context.params;

    if (!id || !isUuid(id)) {
      return jsonError("Valid invoice id is required.", 400);
    }

    const body = await req.json().catch(() => ({}));
    const reason = String(body?.reason || "").trim();

    if (!reason) {
      return jsonError("Cancellation reason is required.", 400);
    }

    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single();

    if (invoiceError || !invoice) {
      return jsonError("Invoice not found or access denied.", 404);
    }

    const currentStatus = String(invoice.status || "").toLowerCase();

    if (["cancelled", "canceled"].includes(currentStatus)) {
      return jsonError("Invoice is already cancelled.", 409);
    }

    const invoiceDate = getInvoiceDate(invoice);

    const { locked, error: lockError } = await isAccountingDateLocked(
      tenantId,
      invoiceDate
    );

    if (lockError) {
      return jsonError(lockError, 500);
    }

    if (locked) {
      return jsonError(
        "This accounting period is locked. Invoice cancellation is blocked.",
        423
      );
    }

    const amount = getInvoiceAmount(invoice);
    const invoiceNo =
      String(invoice.invoice_no || invoice.invoice_number || "").trim() || null;

    let reversalVoucherId: string | null = null;
    let reversalWarning: string | null = null;

    const needsReversal = [
      "posted",
      "approved",
      "sent",
      "paid",
      "partial",
      "partially_paid",
    ].includes(currentStatus);

    if (needsReversal) {
      const reversal = await createReversalVoucher({
        tenantId,
        invoiceId: id,
        invoiceNo,
        amount,
        reason,
        cancelledBy: user.id,
      });

      reversalVoucherId = reversal.reversalVoucherId;
      reversalWarning = reversal.error;
    }

    await supabaseAdmin.from("voucher_cancellations").insert([
      {
        tenant_id: tenantId,
        voucher_id: id,
        reason,
        reversal_voucher_id: reversalVoucherId,
        cancelled_by: user.id,
      },
    ]);

    const { data: updatedInvoice, error: updateError } = await supabaseAdmin
      .from("invoices")
      .update({
        status: "cancelled",
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
        cancelled_by: user.id,
        reversal_voucher_id: reversalVoucherId,
      })
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select("*")
      .single();

    if (updateError) {
      return jsonError(updateError.message, 500);
    }

    return NextResponse.json({
      ok: true,
      message: reversalWarning
        ? "Invoice cancelled, but reversal voucher lines need review."
        : "Invoice cancelled successfully.",
      invoice: updatedInvoice,
      reversal_voucher_id: reversalVoucherId,
      warning: reversalWarning,
    });
  } catch (error: any) {
    return jsonError(error?.message || "Invoice cancellation failed.", 500);
  }
}