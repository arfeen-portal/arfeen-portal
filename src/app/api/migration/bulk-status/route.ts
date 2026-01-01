// src/app/api/migration/bulk-status/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";

export async function PUT(req: Request) {
  const supabase = createSupabaseServerClient();
  const { jobId, ids, status } = (await req.json()) as {
    jobId: string;
    ids: string[];
    status: string;
  };

  if (!jobId || !ids?.length || !status) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const { error } = await supabase
    .from("migration_staging")
    .update({ status })
    .in("id", ids)
    .eq("job_id", jobId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Bulk status updated" });
}
