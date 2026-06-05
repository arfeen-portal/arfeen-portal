import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminSafe } from "@/lib/supabaseAdminSafe";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });
  }

  const [postings, adjustments, reports, jobs, logs] = await Promise.all([
    supabase.from("roznamcha_postings").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("accounting_auto_adjustments").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("operational_reports").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("system_reliability_center").select("*").order("created_at", { ascending: false }).limit(100),
    supabase.from("central_activity_logs").select("*").order("created_at", { ascending: false }).limit(100),
  ]);

  if (postings.error) return NextResponse.json({ error: postings.error.message }, { status: 500 });
  if (adjustments.error) return NextResponse.json({ error: adjustments.error.message }, { status: 500 });
  if (reports.error) return NextResponse.json({ error: reports.error.message }, { status: 500 });
  if (jobs.error) return NextResponse.json({ error: jobs.error.message }, { status: 500 });
  if (logs.error) return NextResponse.json({ error: logs.error.message }, { status: 500 });

  return NextResponse.json({
    postings: postings.data ?? [],
    adjustments: adjustments.data ?? [],
    reports: reports.data ?? [],
    jobs: jobs.data ?? [],
    logs: logs.data ?? [],
  });
}

export async function POST(req: NextRequest) {
  const supabase = getSupabaseAdminSafe();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase admin not configured" }, { status: 500 });
  }

  const body = await req.json();
  const mode = body.mode;

  if (mode === "posting") {
    const { data, error } = await supabase
      .from("roznamcha_postings")
      .insert([{
        title: body.title,
        description: body.description || null,
        debit_account: body.debit_account || null,
        credit_account: body.credit_account || null,
        amount: Number(body.amount || 0),
        currency: body.currency || "PKR",
        fx_rate: Number(body.fx_rate || 1),
        status: "pending_approval",
        created_by: body.created_by || "admin",
      }])
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await supabase.from("central_activity_logs").insert([{
      module_name: "Roznamcha Posting",
      action: "POSTING_CREATED",
      entity_ref: data.posting_no,
      new_status: "pending_approval",
      actor: body.created_by || "admin",
      note: "Roznamcha posting sent for approval",
    }]);

    return NextResponse.json({ posting: data });
  }

  if (mode === "adjustment") {
    const { data, error } = await supabase
      .from("accounting_auto_adjustments")
      .insert([{
        source_type: body.source_type || "manual",
        source_ref: body.source_ref || null,
        adjustment_type: body.adjustment_type,
        debit_account: body.debit_account || null,
        credit_account: body.credit_account || null,
        amount: Number(body.amount || 0),
        currency: body.currency || "PKR",
        reason: body.reason || null,
      }])
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ adjustment: data });
  }

  if (mode === "report") {
    const { data, error } = await supabase
      .from("operational_reports")
      .insert([{
        report_type: body.report_type,
        entity_name: body.entity_name || null,
        total_count: Number(body.total_count || 0),
        success_count: Number(body.success_count || 0),
        failure_count: Number(body.failure_count || 0),
        avg_minutes: Number(body.avg_minutes || 0),
        revenue: Number(body.revenue || 0),
        cost: Number(body.cost || 0),
        remarks: body.remarks || null,
      }])
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ report: data });
  }

  if (mode === "job") {
    const { data, error } = await supabase
      .from("system_reliability_center")
      .insert([{
        job_type: body.job_type,
        title: body.title,
        payload: body.payload || {},
        status: "pending",
        max_retries: Number(body.max_retries || 3),
      }])
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ job: data });
  }

  return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
}