import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function auth() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Missing auth session", status: 401 };

  const { data: userData, error } = await supabase.auth.getUser();
  if (error || !userData?.user) return { error: "Invalid auth token", status: 401 };

  const email = userData.user.email?.toLowerCase();
  if (!email) return { error: "Invalid auth token", status: 401 };

  const { data: profile } = await supabase
    .from("users")
    .select("tenant_id, role")
    .eq("email", email)
    .maybeSingle();

  if (!profile?.tenant_id) return { error: "Tenant not found", status: 403 };

  return {
    tenant_id: profile.tenant_id,
    user_id: userData.user.id,
    role: profile.role,
  };
}

export async function GET() {
  const a = await auth();
  if ("error" in a) {
    return NextResponse.json({ success: false, error: a.error }, { status: a.status });
  }

  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      {
        success: false,
        error: "Supabase admin client not configured",
        data: {
          systemHealth: [],
          controls: [],
          alerts: [],
        },
      },
      { status: 500 }
    );
  }

  const [jobsRes, logsRes] = await Promise.all([
    supabase
      .from("system_reliability_center")
      .select("*")
      .eq("tenant_id", a.tenant_id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("system_activity_logs")
      .select("*")
      .eq("tenant_id", a.tenant_id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (jobsRes.error) {
    return NextResponse.json({ success: false, error: jobsRes.error.message }, { status: 500 });
  }

  if (logsRes.error) {
    return NextResponse.json({ success: false, error: logsRes.error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    jobs: jobsRes.data || [],
    logs: logsRes.data || [],
    data: {
      module: "Accounts System Control",
      status: "ready",
      controls: [
        "Voucher Locking",
        "Period Closing",
        "Ledger Safety",
        "Rollback Control",
        "Audit Monitoring",
      ],
      alerts: [],
    },
  });
}

export async function POST(req: NextRequest) {
  const a = await auth();
  if ("error" in a) {
    return NextResponse.json({ success: false, error: a.error }, { status: a.status });
  }

  const supabase = getSupabaseAdminSafe();

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Supabase admin client not configured" },
      { status: 500 }
    );
  }

  const body = await req.json();

  if (!body.job_name) {
    return NextResponse.json({ success: false, error: "Job name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("system_reliability_center")
    .insert([
      {
        tenant_id: a.tenant_id,
        title: body.job_name,
        job_type: body.job_type || "background_job",
        status: "pending",
        payload: body.payload || {},
      },
    ])
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, job: data });
}