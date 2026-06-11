import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const defaultModules = [
  "dashboard",
  "transport",
  "umrah",
  "hotels",
  "visa",
  "contact",
  "group_tickets",
  "agents",
  "accounts",
  "reports",
  "vouchers",
  "refunds",
  "airline_reports",
  "white_label",
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanDomain(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

function isValidDomain(value: string) {
  if (!value) return true;
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value);
}

function isValidEmail(value: string) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function buildAI(body: any) {
  const monthly = Number(body.monthly_bookings || 0);
  const staff = Number(body.staff_count || 1);
  const agencyType = String(body.agency_type || "umrah").toLowerCase();

  const modules = [
    "Transport",
    "Visa",
    "Hotel",
    "Refund Control",
    "AI Pricing",
    "Agent Scoring",
    "Auto Recovery",
  ];

  if (monthly > 100) modules.push("BSP Reports", "Airline Settlement", "Live Operations");
  if (staff > 5) modules.push("Permission Matrix", "Staff Performance", "Audit Logs");
  if (agencyType.includes("umrah")) modules.push("Umrah AI Command", "Package Builder");

  const onboardingScore =
    25 +
    (body.uploaded_logo_url ? 15 : 0) +
    (body.domain_name ? 15 : 0) +
    (body.country ? 10 : 0) +
    (body.turnover_range ? 10 : 0) +
    Math.min(25, monthly / 10);

  const fraudScore =
    (!body.domain_name ? 20 : 0) +
    (!body.country ? 15 : 0) +
    (monthly > 500 && staff < 2 ? 35 : 0) +
    (String(body.domain_name || "").includes("free") ? 25 : 0);

  return {
    onboarding_score: Math.round(Math.min(100, onboardingScore)),
    fraud_score: Math.round(Math.min(100, fraudScore)),
    recommended_modules: modules,
    brand_suggestions: {
      theme: agencyType.includes("umrah") ? "Luxury Gold Umrah Theme" : "Corporate Travel Blue",
      primary_color: agencyType.includes("umrah") ? "#b8860b" : "#0f766e",
      sidebar_style: "premium-gradient",
      invoice_design: "white-label-modern",
      login_background: "destination-hero",
    },
    content_suggestions: {
      about_us: `Professional ${body.agency_name || "travel agency"} providing reliable travel, Umrah, transport and booking services.`,
      refund_policy: "Refunds are processed according to supplier rules, airline policy and agency approval workflow.",
      invoice_footer: "Thank you for choosing our travel services.",
      whatsapp_intro: "Assalam o Alaikum, welcome to our travel support desk. How can we help you today?",
      seo_title: `${body.agency_name || "Travel Agency"} | Umrah, Flights, Hotels & Transport`,
      seo_description: "Book Umrah packages, transport, hotels, flights and travel services with professional support.",
    },
    erp_configuration: {
      coa: ["Cash", "Bank", "Agents Receivable", "Suppliers Payable", "Sales", "Refunds", "Profit & Loss"],
      voucher_types: ["Receipt", "Payment", "Journal", "Cash", "Bank", "Refund", "Reversal"],
      booking_statuses: ["pending", "confirmed", "in_progress", "completed", "cancelled", "refunded"],
      approval_flows: ["refund approval", "voucher posting approval", "domain approval", "go-live approval"],
      invoice_numbering: "INV-{YEAR}-{00001}",
    },
    training_steps: [
      "Upload company logo",
      "Connect domain",
      "Setup invoice branding",
      "Create first supplier",
      "Create first agent",
      "Create first booking",
      "Generate first voucher",
    ],
    marketplace_requirements: {
      suggested_bundle: "Luxury Umrah White-label Setup",
      add_ons: ["Arabic invoices", "AI pricing", "Live operations", "Refund control", "BSP reports"],
    },
    ai_summary: `AI recommends ${modules.length} modules. Setup is ${Math.round(
      Math.min(100, onboardingScore)
    )}% complete. Fraud probability is ${Math.round(Math.min(100, fraudScore))}%.`,
  };
}

export async function GET() {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase admin client is not configured." },
      { status: 500 }
    );
  }

  const [tenantsRes, aiRes] = await Promise.all([
    supabase.from("saas_tenants").select("*").order("created_at", { ascending: false }),
    supabase.from("ai_saas_onboarding_center").select("*").order("created_at", { ascending: false }),
  ]);

  if (tenantsRes.error) {
    return NextResponse.json({ ok: false, error: tenantsRes.error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    tenants: tenantsRes.data || [],
    ai_items: aiRes.error ? [] : aiRes.data || [],
  });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase admin client is not configured." },
      { status: 500 }
    );
  }

  const body = await req.json();

  if (body.mode === "ai_setup") {
    if (!body.agency_name) {
      return NextResponse.json(
        { ok: false, error: "Agency name is required." },
        { status: 400 }
      );
    }

    const ai = buildAI(body);

    const payload = {
      agency_name: body.agency_name,
      agency_type: body.agency_type || "umrah",
      country: body.country || null,
      staff_count: Number(body.staff_count || 1),
      monthly_bookings: Number(body.monthly_bookings || 0),
      turnover_range: body.turnover_range || null,
      uploaded_logo_url: body.uploaded_logo_url || null,
      domain_name: cleanDomain(body.domain_name || ""),
      status: "ai_generated",
      ...ai,
    };

    const { data, error } = await supabase
      .from("ai_saas_onboarding_center")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, item: data });
  }

  const tenantName = String(body.tenant_name || "").trim();
  const customDomain = body.custom_domain ? cleanDomain(body.custom_domain) : null;
  const contactEmail = body.contact_email
    ? String(body.contact_email).trim().toLowerCase()
    : null;

  if (!tenantName) {
    return NextResponse.json(
      { ok: false, error: "Tenant name is required." },
      { status: 400 }
    );
  }

  if (customDomain && !isValidDomain(customDomain)) {
    return NextResponse.json(
      { ok: false, error: "Custom domain format is invalid." },
      { status: 400 }
    );
  }

  if (contactEmail && !isValidEmail(contactEmail)) {
    return NextResponse.json(
      { ok: false, error: "Contact email format is invalid." },
      { status: 400 }
    );
  }

  const slug = slugify(body.slug || tenantName);
  const subdomain = body.subdomain ? slugify(body.subdomain) : slug;

  if (!slug) {
    return NextResponse.json(
      { ok: false, error: "Valid tenant slug could not be generated." },
      { status: 400 }
    );
  }

  if (customDomain) {
    const { data: existingDomain, error: domainError } = await supabase
      .from("saas_tenants")
      .select("id")
      .eq("custom_domain", customDomain)
      .maybeSingle();

    if (domainError) {
      return NextResponse.json({ ok: false, error: domainError.message }, { status: 500 });
    }

    if (existingDomain) {
      return NextResponse.json(
        { ok: false, error: "This domain is already attached to another tenant." },
        { status: 409 }
      );
    }
  }

  const { data: existingSlug, error: slugError } = await supabase
    .from("saas_tenants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (slugError) {
    return NextResponse.json({ ok: false, error: slugError.message }, { status: 500 });
  }

  if (existingSlug) {
    return NextResponse.json(
      { ok: false, error: "This tenant slug already exists." },
      { status: 409 }
    );
  }

  const ai = buildAI({
    agency_name: tenantName,
    agency_type: body.agency_type || "umrah",
    country: body.country || "Pakistan",
    monthly_bookings: body.monthly_bookings || 0,
    staff_count: body.staff_count || 1,
    domain_name: customDomain,
    uploaded_logo_url: body.logo_url,
    turnover_range: body.turnover_range || "medium",
  });

  const payload = {
    tenant_name: tenantName,
    slug,
    subdomain,
    custom_domain: customDomain,
    logo_url: body.logo_url || null,
    primary_color: body.primary_color || ai.brand_suggestions.primary_color || "#0f766e",
    secondary_color: body.secondary_color || "#111827",
    contact_email: contactEmail,
    contact_phone: body.contact_phone || null,
    bio: body.bio || ai.content_suggestions.about_us,
    plan_name: body.plan_name || "starter",
    allowed_modules: Array.isArray(body.allowed_modules) ? body.allowed_modules : defaultModules,
    status: "pending_approval",
    approval_status: "pending",
    domain_verified: false,
    approved_at: null,
    go_live_at: null,
    ai_setup_score: ai.onboarding_score,
    ai_risk_score: ai.fraud_score,
    ai_summary: ai.ai_summary,
  };

  const { data, error } = await supabase
    .from("saas_tenants")
    .insert([payload])
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    tenant: data,
    ai,
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase admin client is not configured." },
      { status: 500 }
    );
  }

  const body = await req.json();
  const id = body.id;
  const action = body.action;

  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Tenant id is required." },
      { status: 400 }
    );
  }

  const { data: tenant, error: readError } = await supabase
    .from("saas_tenants")
    .select("*")
    .eq("id", id)
    .single();

  if (readError || !tenant) {
    return NextResponse.json(
      { ok: false, error: readError?.message || "Tenant not found." },
      { status: 404 }
    );
  }

  let updatePayload: any = {};

  if (action === "approve") {
    updatePayload = {
      status: "approved_ready",
      approval_status: "approved",
      approved_by: body.approved_by || "admin",
      approved_at: new Date().toISOString(),
      rejection_reason: null,
    };
  } else if (action === "reject") {
    updatePayload = {
      status: "rejected",
      approval_status: "rejected",
      rejection_reason: body.rejection_reason || "Rejected by admin.",
    };
  } else if (action === "go_live") {
    if (tenant.status !== "approved_ready") {
      return NextResponse.json(
        { ok: false, error: "Tenant must be approved before Go Live." },
        { status: 400 }
      );
    }

    if (!tenant.custom_domain) {
      return NextResponse.json(
        { ok: false, error: "Custom domain required before Go Live." },
        { status: 400 }
      );
    }

    updatePayload = {
      status: "live",
      approval_status: "approved",
      domain_verified: true,
      go_live_at: new Date().toISOString(),
    };
  } else if (action === "update") {
    updatePayload = {
      tenant_name: body.tenant_name,
      custom_domain: body.custom_domain ? cleanDomain(body.custom_domain) : null,
      logo_url: body.logo_url || null,
      primary_color: body.primary_color,
      secondary_color: body.secondary_color,
      contact_email: body.contact_email || null,
      contact_phone: body.contact_phone || null,
      bio: body.bio || null,
      plan_name: body.plan_name,
      allowed_modules: Array.isArray(body.allowed_modules) ? body.allowed_modules : [],
      updated_at: new Date().toISOString(),
    };
  } else {
    return NextResponse.json(
      { ok: false, error: "Invalid action." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("saas_tenants")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    tenant: data,
  });
}