import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function generateInvoiceNo() {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);

  const randomPadding = Math.floor(1000 + Math.random() * 9000);

  return `INV-${stamp}-${randomPadding}`;
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
          // Safe no-op for server contexts where cookies cannot be written.
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
      error: "Unauthorized session or token expired.",
    };
  }

  return { user, error: null };
}

async function getTenantIdForUser(
  userId: string,
  metadataTenantId?: string | null
) {
  const supabaseAdmin = getSupabaseAdminSafe();

  if (!supabaseAdmin) {
    return {
      tenantId: null,
      error: "Supabase admin client is not configured.",
    };
  }

  if (metadataTenantId && isUuid(metadataTenantId)) {
    return { tenantId: metadataTenantId, error: null };
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

async function isPeriodLocked(tenantId: string, dateStr: string) {
  const supabaseAdmin = getSupabaseAdminSafe();

  if (!supabaseAdmin) {
    return {
      locked: true,
      error: "Supabase admin client is not configured.",
    };
  }

  const { data, error } = await supabaseAdmin
    .from("accounting_period_locks")
    .select("id")
    .eq("tenant_id", tenantId)
    .lte("start_date", dateStr)
    .gte("end_date", dateStr)
    .limit(1)
    .maybeSingle();

  if (error) {
    const message = String(error.message || "");

    if (message.includes("does not exist")) {
      return { locked: false, error: null };
    }

    return { locked: true, error: message };
  }

  return {
    locked: Boolean(data?.id),
    error: null,
  };
}

function getBookingTable(bookingType: string) {
  const allowedTypes: Record<string, string> = {
    transport: "transport_bookings",
    umrah: "umrah_bookings",
    hotel: "hotel_bookings",
    flight: "flight_bookings",
  };

  return allowedTypes[bookingType] || null;
}

function getCustomerName(booking: Record<string, any>) {
  return (
    booking.customer_name ||
    booking.passenger_name ||
    booking.guest_name ||
    booking.client_name ||
    "Customer"
  );
}

function getCustomerPhone(booking: Record<string, any>) {
  return booking.customer_phone || booking.phone || booking.mobile || null;
}

function getTotalAmount(booking: Record<string, any>) {
  const directTotal =
    booking.total_price ??
    booking.total_amount ??
    booking.grand_total ??
    booking.sale_price;

  if (directTotal !== undefined && directTotal !== null) {
    return Number(directTotal) || 0;
  }

  const baseFare = Number(booking.base_fare || 0);
  const taxes = Number(booking.tax_amount || booking.taxes || 0);

  return baseFare + taxes;
}

function getTaxAmount(booking: Record<string, any>, bookingType: string) {
  if (bookingType === "flight") {
    return Number(
      booking.tax_amount ?? booking.taxes ?? booking.total_taxes ?? 0
    );
  }

  return Number(booking.tax_amount ?? 0);
}

function getBookingDate(booking: Record<string, any>) {
  return String(
    booking.booking_date ||
      booking.pickup_time ||
      booking.created_at ||
      new Date().toISOString()
  ).slice(0, 10);
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdminSafe();

    if (!supabaseAdmin) {
      return jsonError("Supabase admin client is not configured.", 500);
    }

    const { user, error: authError } = await getAuthUser();

    if (authError || !user) {
      return jsonError(authError || "Unauthorized action.", 401);
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

    const body = await req.json().catch(() => ({}));

    const bookingId = String(body?.booking_id || "").trim();
    const bookingType = String(body?.booking_type || "transport")
      .toLowerCase()
      .trim();

    if (!bookingId || !isUuid(bookingId)) {
      return jsonError("A valid booking_id UUID is required.", 400);
    }

    const tableName = getBookingTable(bookingType);

    if (!tableName) {
      return jsonError(`Invalid booking type: ${bookingType}`, 400);
    }

    const { data: existingInvoice, error: existingError } = await supabaseAdmin
      .from("invoices")
      .select("id, invoice_no, status")
      .eq("tenant_id", tenantId)
      .eq("booking_id", bookingId)
      .eq("booking_type", bookingType)
      .neq("status", "cancelled")
      .maybeSingle();

    if (existingError) {
      return jsonError(existingError.message, 500);
    }

    if (existingInvoice?.id) {
      return NextResponse.json({
        ok: true,
        message: "Invoice already exists for this booking segment.",
        invoice: existingInvoice,
        duplicate: true,
      });
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from(tableName)
      .select("*")
      .eq("id", bookingId)
      .eq("tenant_id", tenantId)
      .single();

    if (bookingError || !booking) {
      return jsonError(
        `${bookingType} booking record not found or access denied.`,
        404
      );
    }

    const bookingDate = getBookingDate(booking);

    const { locked, error: lockError } = await isPeriodLocked(
      tenantId,
      bookingDate
    );

    if (lockError) {
      return jsonError(lockError, 500);
    }

    if (locked) {
      return jsonError(
        "This accounting period is locked. Invoice creation is blocked.",
        423
      );
    }

    const customerName = getCustomerName(booking);
    const customerPhone = getCustomerPhone(booking);

    const grandTotal = Math.max(getTotalAmount(booking), 0);
    const rawTaxAmount = Math.max(getTaxAmount(booking, bookingType), 0);
    const taxAmount = Math.min(rawTaxAmount, grandTotal);
    const subtotal = Math.max(grandTotal - taxAmount, 0);

    const invoiceNo = generateInvoiceNo();

    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from("invoices")
      .insert([
        {
          tenant_id: tenantId,
          invoice_no: invoiceNo,
          booking_id: bookingId,
          booking_type: bookingType,

          customer_name: customerName,
          customer_phone: customerPhone,

          agent_id: booking.agent_id || null,
          agent_name: booking.agent_name || null,
          agent_code: booking.agent_code || null,

          subtotal,
          tax_amount: taxAmount,
          discount_amount: 0,
          total_amount: grandTotal,
          grand_total: grandTotal,
          paid_amount: 0,
          balance_amount: grandTotal,

          status: "draft",
          notes: `System auto-created from ${bookingType} booking.`,
          created_by: user.id,
        },
      ])
      .select("*")
      .single();

    if (invoiceError || !invoice) {
      return jsonError(
        `Invoice pipeline failed: ${invoiceError?.message || "Unknown error"}`,
        500
      );
    }

    const { error: itemError } = await supabaseAdmin.from("invoice_items").insert([
      {
        tenant_id: tenantId,
        invoice_id: invoice.id,
        item_type: bookingType,
        description: `${bookingType.toUpperCase()} booking fulfillment component invoice`,
        quantity: 1,
        unit_price: grandTotal,
        total_price: grandTotal,
      },
    ]);

    if (itemError) {
      await supabaseAdmin
        .from("invoices")
        .delete()
        .eq("id", invoice.id)
        .eq("tenant_id", tenantId);

      return jsonError(
        `Invoice line item creation failed: ${itemError.message}`,
        500
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Secure transaction invoice generated from active booking component.",
      invoice,
    });
  } catch (error: any) {
    return jsonError(
      error?.message || "Invoice orchestration pipeline failure.",
      500
    );
  }
}