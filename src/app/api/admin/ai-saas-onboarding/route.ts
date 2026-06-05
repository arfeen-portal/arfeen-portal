import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    return NextResponse.json({ ok: false, error: "Supabase admin client not configured." }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("ai_saas_onboarding_center")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, items: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Supabase admin client not configured." }, { status: 500 });
  }

  const body = await req.json();

  if (!body.agency_name) {
    return NextResponse.json({ ok: false, error: "Agency name is required." }, { status: 400 });
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
    domain_name: body.domain_name || null,
    status: "ai_generated",
    ...ai,
  };

  const { data, error } = await supabase
    .from("ai_saas_onboarding_center")
    .insert([payload])
    .select("*")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, item: data });
}