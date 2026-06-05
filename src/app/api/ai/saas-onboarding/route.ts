import { NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const fallbackSummary = {
  total_leads: 2,
  leads: 2,
  in_progress: 1,
  live_accounts: 1,
  avg_progress: 80,
};

const fallbackRequests = [
  {
    id: "demo-1",
    company_name: "Al Noor Travels",
    owner_name: "Muhammad Ali",
    email: "info@alnoortravel.com",
    phone: "+966500000000",
    country: "Saudi Arabia",
    city: "Makkah",
    domain: "alnoortravel.com",
    preferred_theme: "royal-blue-gold",
    package_plan: "Premium",
    status: "in_progress",
    progress_percent: 72,
    notes: "Demo onboarding request",
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-2",
    company_name: "Haramain Services",
    owner_name: "Ahmed Raza",
    email: "admin@haramainservices.com",
    phone: "+966511111111",
    country: "Saudi Arabia",
    city: "Madinah",
    domain: "haramainservices.com",
    preferred_theme: "emerald-luxury",
    package_plan: "Enterprise",
    status: "live",
    progress_percent: 88,
    notes: "Demo live account",
    created_at: new Date().toISOString(),
  },
];

export async function GET() {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json({
        summary: fallbackSummary,
        requests: fallbackRequests,
        error: "Supabase admin client not configured",
      });
    }

    const [{ data: summary }, { data: requests }] = await Promise.all([
      supabase.from("v_saas_onboarding_summary").select("*").single(),
      supabase
        .from("saas_onboarding_requests")
        .select("*, saas_onboarding_tasks(*)")
        .order("created_at", { ascending: false }),
    ]);

    return NextResponse.json({
      summary: summary ?? fallbackSummary,
      requests: Array.isArray(requests) ? requests : fallbackRequests,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        summary: fallbackSummary,
        requests: fallbackRequests,
        error: error?.message ?? "SaaS onboarding failed",
      },
      { status: 200 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseAdminSafe();

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin client not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const { data: request, error } = await supabase
      .from("saas_onboarding_requests")
      .insert([
        {
          company_name: body.company_name,
          owner_name: body.owner_name,
          email: body.email ?? null,
          phone: body.phone ?? null,
          country: body.country ?? null,
          city: body.city ?? null,
          domain: body.domain ?? null,
          preferred_theme: body.preferred_theme ?? "royal-blue-gold",
          package_plan: body.package_plan ?? "starter",
          status: body.status ?? "lead",
          progress_percent: Number(body.progress_percent || 10),
          notes: body.notes ?? null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    const tasks = [
      ["Company profile verified", "profile", 1],
      ["Domain connected", "domain", 2],
      ["Theme configured", "theme", 3],
      ["Modules enabled", "modules", 4],
      ["First admin user invited", "admin_user", 5],
      ["Go-live checklist completed", "go_live", 6],
    ];

    await supabase.from("saas_onboarding_tasks").insert(
      tasks.map(([task_title, task_key, sort_order]) => ({
        request_id: request.id,
        task_title,
        task_key,
        sort_order,
      }))
    );

    return NextResponse.json({ request });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "SaaS onboarding creation failed" },
      { status: 500 }
    );
  }
}