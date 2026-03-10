"use server";

import { createClient } from "@/lib/supabaseServer";

export async function getLedgerSummary() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("agent_ledger_agent_summary")
    .select("*")
    .order("agent_name", { ascending: true });

  if (error) {
    console.error("Ledger summary error", error);
    return [];
  }

  return data ?? [];
}