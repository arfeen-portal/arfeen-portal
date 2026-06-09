"use server";

import { supabaseClient } from "@/lib/supabaseClient";

export async function getLedgerSummary() {
  const supabase = supabaseClient;

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